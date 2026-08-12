//External
import EasySpeech from "easy-speech";

//Composables
import { aggregateVillagers, hasResourceValue } from "@/composables/builds/villagerAggregator.js";
import { convertDescriptionToText } from "@/composables/builds/icons/iconText.js";

//How the build should sound wherever we get to choose. Restated for the
//platform path below, which has no defaults of ours to fall back on.
const LANGUAGE = "en-GB";
const RATE = 0.8;
const PITCH = 1;
const VOLUME = 1;

//Whether EasySpeech got as far as a usable voice list.
//
//False is not "this browser cannot speak". Edge on Android enumerates no voices
//at all and still speaks perfectly well through the Android engine — but
//EasySpeech refuses to initialise without a list, and every one of its methods
//throws from then on. That is the whole of the Edge-on-Android silence: not a
//refusal to speak, a refusal to be configured. So this flag picks between
//speaking through EasySpeech and speaking straight at the platform.
let easySpeechReady = false;

//Called when the browser refuses an utterance outright. Module-level because
//one focus mode runs at a time, and the alternative is threading a callback
//through every speak() call site for a case that almost never fires.
let refusalListener = null;

/**
 * Registers the one thing worth telling a player about voice-over.
 *
 * Everything else here degrades quietly — a missing voice list, a lost
 * initialisation — because the build still plays and the text is still on
 * screen. A refusal is different: the feature is on, the player expects sound,
 * and nothing about the screen says why there is none.
 *
 * @param {Function|null} listener - Called with the browser's own error string.
 */
export function onSpeechRefused(listener) {
  refusalListener = listener;
}

export async function initTextToSpeech() {
  easySpeechReady = await initEasySpeech();
  if (!easySpeechReady) return;

  //Only once initialised: defaults() throws on an uninitialised EasySpeech, and
  //throwing here used to take the rest of focus mode's mount with it — the
  //opening step never got announced because choosing its voice had already
  //failed.
  const voice = pickVoice();
  EasySpeech.defaults({ voice: voice ?? undefined, pitch: PITCH, rate: RATE, volume: VOLUME });
}

/**
 * @return {Promise<boolean>} Whether EasySpeech can be used from here on.
 */
async function initEasySpeech() {
  try {
    await EasySpeech.init({ maxTimeout: 5000, interval: 250 });
    return true;
  } catch (error) {
    console.warn(
      "[voice-over] no voice list from this browser; speaking with its default voice instead.",
      error?.message ?? error
    );
    return false;
  }
}

/**
 * The voice this build should be read in, most specific match first.
 *
 * Named voices rather than a language filter, because the generic en-GB voice a
 * browser ships is usually its worst one. Null when the browser has none of
 * them, which is a normal answer: the platform then picks for itself.
 *
 * @return {Object|null} A SpeechSynthesisVoice, or null.
 */
function pickVoice() {
  const byURI = (voiceURI) => EasySpeech.filterVoices({ voiceURI })[0];

  return (
    byURI("Andrew") || //Edge on Windows
    byURI("Google UK English Male") || //Chrome on Windows
    byURI("Mark") || //Firefox on Windows
    byURI("moz-tts:android:en_GB") || //Firefox on Android
    EasySpeech.filterVoices({ name: "Englisch Vereinigtes Königreich" })[0] || //Chrome on German Android
    EasySpeech.filterVoices({ language: LANGUAGE })[0] ||
    null
  );
}

export async function speak(step, announceVillagers = true) {
  const text = getText(step, announceVillagers);
  //Nothing to say. A step can be all icons and no words once the images are
  //resolved, and an empty utterance is rejected rather than skipped.
  if (!text.trim()) return;

  if (easySpeechReady) {
    try {
      //Deliberately not awaited. The promise settles when the utterance *ends*,
      //and rejects when one is interrupted — which is what stop() does on every
      //step change, so awaiting it would turn normal playback into a stream of
      //errors.
      EasySpeech.speak({ text, boundary: () => {}, error: reportRefusal }).catch(() => {});
      return;
    } catch (error) {
      //Threw before reaching the engine. The platform below is still worth a try.
      console.warn("[voice-over] EasySpeech refused the utterance:", error?.message ?? error);
    }
  }

  speakWithPlatformVoice(text);
}

/**
 * Speaks through the Web Speech API directly, with no voice named.
 *
 * The fallback for every browser EasySpeech will not initialise on. Leaving
 * `voice` unset is the point: the engine then uses whatever it has, which is
 * exactly what a browser with an empty voice list needs.
 *
 * @param {string} text - What to say.
 */
function speakWithPlatformVoice(text) {
  const synthesis = window.speechSynthesis;
  if (!synthesis || typeof window.SpeechSynthesisUtterance !== "function") return;

  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGE;
  utterance.pitch = PITCH;
  utterance.rate = RATE;
  utterance.volume = VOLUME;
  utterance.addEventListener("error", reportRefusal);

  synthesis.speak(utterance);
}

/**
 * @param {SpeechSynthesisErrorEvent} event - The engine's own error event.
 */
function reportRefusal(event) {
  const reason = event?.error;

  //Ours, not the browser's: stop() fires one of these on every step change.
  if (!reason || reason === "interrupted" || reason === "canceled") return;

  console.warn(`[voice-over] the browser would not speak: ${reason}`);
  refusalListener?.(reason);
}

export function stop() {
  try {
    EasySpeech.cancel();
  } catch {
    //Never initialised, so there is nothing of its to cancel. The platform's
    //own queue below is a separate matter and always worth clearing.
  }

  window.speechSynthesis?.cancel();
}

function getText(step, announceVillagers = true){
  //A note carries no description of its own, and a step can carry neither.
  const description = step?.description ?? step?.gameplan ?? "";

  //The shared converter, so what is spoken and what is indexed are the same
  //sentence. Everything below this line is speech-only and must stay here:
  //villager counts are the step's *other* fields, and the "!" markers are
  //pauses for the synthesiser, not words.
  var text = convertDescriptionToText(description);

  //convert villagers
  if (announceVillagers && aggregateVillagers(step) > 0) {
    text += "! - ! - ! You should have ";
    text += hasResourceValue(step.builders) ? step.builders + " building. " : "";
    text += hasResourceValue(step.food) ? step.food + " on food. " : "";
    text += hasResourceValue(step.wood) ? step.wood + " on wood. " : "";
    text += hasResourceValue(step.gold) ? step.gold + " on gold. " : "";
    text += hasResourceValue(step.stone) ? step.stone + " on stone. " : "";
  }

  return text;
}

