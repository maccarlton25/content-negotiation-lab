import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "label-12",
            "label-13",
            "label-14",
            "label-16",
            "label-12-mono",
            "label-13-mono",
            "label-14-mono",
            "copy-14",
            "copy-16",
            "copy-14-mono",
            "heading-20",
            "heading-24",
            "heading-32",
            "heading-40",
            "heading-56",
            "heading-72",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
