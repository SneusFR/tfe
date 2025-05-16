/**
 * Utility function to conditionally join classNames together
 * @param classes - Array of class names or objects mapping class names to boolean values
 * @returns String of joined class names
 */
export function cn(...classes: (string | boolean | undefined | null | { [key: string]: boolean })[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return cls;
    })
    .join(' ');
}
