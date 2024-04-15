//External
import EasySpeech from "easy-speech";

//Composables
import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";
import iconService from "@/composables/builds/icons/iconService.js";

var civIconService = null;

export async function initTextToSpeech() {
  civIconService = iconService();

  await EasySpeech.init({ maxTimeout: 5000, interval: 250 })
    .then(() => console.debug("load complete"))
    .catch((e) => console.error(e));

  var voice = EasySpeech.filterVoices({ voiceURI: "Andrew" })[0]; //Edge on Windows
  voice = voice ? voice : EasySpeech.filterVoices({ voiceURI: "Google UK English Male" })[0]; //Chrome on Windows
  voice = voice ? voice : EasySpeech.filterVoices({ voiceURI: "Mark" })[0]; //Firefox on Windows
  console.log("Voice", voice);

  EasySpeech.defaults({ voice: voice, pitch: 1, rate: 0.8, volume: 1 });
}

export async function speak(step) {
  const text = getText(step);

  await EasySpeech.init(); // required
  EasySpeech.speak({
    text: text,
    boundary: (e) => console.debug("Text to speec boundary reached", e),
  });
}

export async function stop() {
  EasySpeech.cancel();
}

function getText(step){
  var text = "";

  //convert description
  text = convertImagesToText(step.description);
  text = convertLineBreaks(text);
  text = convertSpecialCharacters(text);

  //convert villagers
  if (aggregateVillagers(step) > 0) {
    text += "! - ! - ! Target the following villager distribution: "
    text += step.builders ? step.builders + " building. " : "";
    text += step.food ? step.food + " on food. " : "";
    text += step.wood ? step.wood + " on wood. " : "";
    text += step.gold ? step.gold + " on gold. " : "";
    text += step.stone ? step.stone + " on stone. " : "";
  }

  return text;
}

function convertImagesToText(description) {
  const regex = /<img([\w\W]+?)>/g;
  const convertedDescription = description.replace(
    regex,
    function replacer(match) {
      return convertImageToText(match);
    }
  );
  return convertedDescription;
}

function convertLineBreaks(description) {
  return description.replaceAll("<br />", ". ");;
}

function convertSpecialCharacters(description) {
  description = description.replaceAll("<-", " See to the left. ");
  description = description.replaceAll("->", " See to the right. ");
  description = description.replaceAll(">", " on ");
  description = description.replaceAll("->", " on ");
  description = description.replaceAll("=>", " on ");
  description = description.replaceAll("&lt;-", " See to the left. ");
  description = description.replaceAll("-&gt;", " ,then ");

  return description.replaceAll(">", "on");
}

function convertImageToText(imageElement) {
  //Get src
  const regex = /src\s*=\s*"(.+?)"/g;
  const matches = imageElement.match(regex);

  if (matches[0]) {
    //Remove internal path extensions, ", and src=
    var imageSource = matches[0].replaceAll('"', "");
    imageSource = imageSource.replaceAll("src=", "");

    
    imageSource = imageSource.replace("http://localhost:5173", "");
    imageSource = imageSource.replace("https://aoe4guides.com", "");

    //Get image metadata -> title
    const iconMetaData = civIconService.getIconFromImgPath(imageSource);
    const title = iconMetaData.title;

    //Add spacing
    return " "+ title +" ";
  }
}
