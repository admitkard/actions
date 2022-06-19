export const truncateString = (str, length) => {
  if (str.length <= length) {
    return str;
  } else {
    const truncatedString = str.slice(str.length - length, str.length);
    return `...${truncatedString}`;
  }
};
