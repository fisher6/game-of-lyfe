import type { AppLocale } from "@/lib/i18n/types";

/** Canonical English `northStar` in save → Hebrew label for UI only. */
const NORTH_STAR_HE: Record<string, string> = {
  "Engineer / builder": "מהנדסת / בונה",
  "Doctor / healer": "רופאה / מרפאה",
  "Lawyer / advocate": "עורכת דין / סנגורית",
  "Artist / creator": "אמנית / יוצרת",
  "Social media creator": "יוצרת תוכן ברשת",
  Entrepreneur: "יזמית",
  Athlete: "ספורטאית",
  "Teacher / mentor": "מורה / חונכת",
  Traveler: "מטיילת",
  Undecided: "טרם הוחלט",
};

/** Canonical English `homeLabel` in save → Hebrew for UI only. */
const HOME_LABEL_HE: Record<string, string> = {
  "Parents' house": "בית ההורים",
  None: "ללא",
  "Renting · away from parents": "שכירות · רחוק מההורים",
  "Renting · no owned home": "שכירות · בלי נכס בבעלות",
  "Renting · sublet side income": "שכירות · הכנסה מהשכרת משנה",
  "Unhoused · insecure housing": "ללא דיור קבוע · דיור לא בטוח",
  "Condo · ~$285k · mortgage": "דירה · ~285 אלף דולר · משכנתא",
  "Townhouse · ~$395k · mortgage": "טאון־האוס · ~395 אלף · משכנתא",
  "House · ~$495k · mortgage": "בית · ~495 אלף · משכנתא",
  "Fixer · ~$210k · mortgage + repairs": "נכס לשיפוץ · ~210 אלף · משכנתא + שיפוצים",
  "Duplex · ~$540k · rented unit": "דופלקס · ~540 אלף · יחידה משכורת",
  "Rental owned · you rent a room elsewhere": "נכס השכרה בבעלותכן · אתן שוכרות חדר במקום אחר",
};

export function displayNorthStar(value: string, locale: AppLocale): string {
  if (locale !== "he") return value;
  return NORTH_STAR_HE[value] ?? value;
}

export function displayHomeLabel(value: string, locale: AppLocale): string {
  if (locale !== "he") return value;
  return HOME_LABEL_HE[value] ?? value;
}
