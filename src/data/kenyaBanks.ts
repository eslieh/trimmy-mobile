export type KenyaBank = {
  name: string;
  shortcode: string;
};

// Bank (paybill) shortcodes for direct bank account payments in Kenya.
export const KENYA_BANKS: KenyaBank[] = [
  { name: 'KCB Bank', shortcode: '522522' },
  { name: 'Equity Bank Kenya', shortcode: '247247' },
  { name: 'Co-operative Bank of Kenya', shortcode: '400200' },
  { name: 'Absa Bank Kenya', shortcode: '303030' },
  { name: 'NCBA Bank Kenya', shortcode: '880100' },
  { name: 'Standard Chartered Bank', shortcode: '329329' },
  { name: 'Diamond Trust Bank (DTB)', shortcode: '516600' },
  { name: 'Stanbic Bank Kenya', shortcode: '600100' },
  { name: 'I&M Bank Kenya', shortcode: '542542' },
  { name: 'Family Bank', shortcode: '007474' },
];
