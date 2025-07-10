export default function useCopyToClipboard() {
  const copyToClipboard = async (text) => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not supported');
      }

      // Try to write text directly first (simpler approach)
      await navigator.clipboard.writeText(text);
      console.log("Copied to clipboard successfully!");
      return true;
    } catch (error) {
      console.error("Trying fallback- unable to write to clipboard:", error);
      
      // Fallback: try the ClipboardItem approach
      try {
        const type = "text/plain";
        const blob = new Blob([text], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
        console.log("Copied to clipboard successfully using ClipboardItem!");
        return true;
      } catch (fallbackError) {
        console.error("Fallback clipboard write also failed:", fallbackError);
        return false;
      }
    }
  };

  const copyToClipboardSupported = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        return false;
      }

      // Try to check permissions if supported
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: "clipboard-write" });
          return permission.state === "granted" || permission.state === "prompt";
        } catch (error) {
          // Permissions API not supported, but clipboard might still work
          return true;
        }
      }

      // If permissions API available, but not permissions, assume clipboard might work
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    copyToClipboard,
    copyToClipboardSupported
  }
}