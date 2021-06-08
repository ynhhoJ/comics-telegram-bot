class Utils {
  public static removeMultipleSpaces(string: string): string {
    return string.replace(/\s{2,}/g, ' ');
  }
}

export default Utils;
