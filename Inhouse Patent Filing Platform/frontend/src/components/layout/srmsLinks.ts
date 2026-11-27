/**
 * Official SRMS destinations referenced from the header and footer.
 * These are the same URLs used by https://www.srms.ac.in/ itself.
 */
export interface ExternalLink {
  label: string;
  href: string;
}

export const SRMS_QUICK_LINKS: ExternalLink[] = [
  { label: "SRMS Home", href: "https://www.srms.ac.in/" },
  { label: "SRMS CET, Bareilly", href: "https://www.srms.ac.in/cet/" },
  { label: "SRMS in News", href: "https://www.srms.ac.in/news-of-srms/" },
  { label: "Contact Us", href: "https://www.srms.ac.in/contact-us-2/" },
];

export const SRMS_INSTITUTIONS: ExternalLink[] = [
  {
    label: "SRMS College of Engineering & Technology, Bareilly",
    href: "https://www.srms.ac.in/cet/",
  },
  {
    label: "SRMS College of Engineering, Technology & Research, Bareilly",
    href: "https://www.srms.ac.in/cetr/",
  },
  {
    label: "SRMS International Business School, Lucknow",
    href: "https://www.srms.ac.in/ibs/",
  },
  {
    label: "SRMS Institute of Medical Sciences, Bareilly",
    href: "https://www.srms.ac.in/ims/",
  },
];
