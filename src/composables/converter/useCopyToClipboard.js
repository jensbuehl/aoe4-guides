export default function useOverlayConverter() {
  const copyToClipboard = (text) => {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state === "granted") {
        const type = "text/plain";
        const blob = new Blob([text], { type });
        let data = [new ClipboardItem({ [type]: blob })];
        navigator.clipboard.write(data).then(
          function () {
            console.log("Copied to clipboard successfully!");
          },
          function (err) {
            console.error("Unable to write to clipboard.", err);
          }
        );
      }
    });
  };

  return {
    copyToClipboard
  };
}
