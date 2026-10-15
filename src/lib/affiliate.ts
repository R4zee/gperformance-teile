// Hängt die Partner-IDs an Shop-Links. IDs kommen aus .env (siehe .env.example).
import { DEFAULT_IDS, withPartnerIds } from './affiliate-core.mjs';

const IDS = {
  amazon: import.meta.env.PUBLIC_AMAZON_TAG || DEFAULT_IDS.amazon,
  ebay: import.meta.env.PUBLIC_EBAY_CAMPID || DEFAULT_IDS.ebay
};
export const affiliateUrl = (raw: string | null | undefined): string => withPartnerIds(raw, IDS);
