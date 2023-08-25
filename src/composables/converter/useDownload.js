export default function useOverlayConverter() {
  const download = (text, filename) => {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const e = document.createEvent("MouseEvents"),
      a = document.createElement("a");
    a.download = filename + ".bo";
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    e.initEvent(
      "click",
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    a.dispatchEvent(e);
  };

  return {
    download
  };
}
