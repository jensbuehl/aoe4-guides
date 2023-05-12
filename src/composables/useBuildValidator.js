export default function useBuildValidator() {
  const validateBuild = (build) => {

    //check title
    if (!build.title){
      return "Title is required. Please set a build order title."
    }

    //check video
    return validateVideo(build.video)
  };

  const validateVideo = (video) => {
    if (video){
      var regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      var match = video.match(regExp);
      if (!match || match[2].length != 11) {
        return "Invalid youtube video link. Please update build order video.";
      }
    }
    return null;
  };

  return { validateBuild, validateVideo };
}
