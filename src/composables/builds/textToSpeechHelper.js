import EasySpeech from "easy-speech";

export async function initTextToSpeech() {
  await EasySpeech.init({ maxTimeout: 5000, interval: 250 })
    .then(() => console.debug("load complete"))
    .catch((e) => console.error(e));

  var voice = EasySpeech.filterVoices({ voiceURI: "Andrew" })[0]; //Edge on Windows
  voice = voice ? voice : EasySpeech.filterVoices({ voiceURI: "Google UK English Male" })[0]; //Chrome on Windows
  voice = voice ? voice : EasySpeech.filterVoices({ voiceURI: "Mark" })[0]; //Firefox on Windows
  console.log("Voice", voice);

  EasySpeech.defaults({ voice: voice });
}

export async function speak(step) {
  const text = getText(step);

  await EasySpeech.init(); // required
  EasySpeech.speak({
    text: text,
    //voice: myLangVoice, // optional, will use a default or fallback
    pitch: 1,
    rate: 1,
    volume: 1,
    // there are more events, see the API for supported events
    boundary: (e) => console.debug("boundary reached"),
  });
}

export async function stop() {
  //TODO: Stop, e.g. on manual next step or when disabled
}

function getText(step){
  //TODO: build speech text from step
  return "3 Villagers on wood!"
}
