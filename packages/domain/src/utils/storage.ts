export const getFileNameFromUrl = (url: string): string | undefined | null => {
  if (!url || typeof url !== "string") {
    return null;
  }

  try {
    // Create a URL object to handle the parsing
    const urlObject = new URL(url);
    // Get the pathname and split it to get the last segment
    const pathSegments = urlObject.pathname.split("/");
    // Get the last segment (filename)
    const fileName = pathSegments[pathSegments.length - 1];

    // Return null if no filename is found
    if (!fileName) {
      return null;
    }

    // Remove any query parameters
    return fileName.split("?")[0];
  } catch (error) {
    console.error("Error parsing file name from URL:", error);
    return null;
  }
};
