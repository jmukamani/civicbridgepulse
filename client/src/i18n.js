import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      login: "Login",
      register: "Register",
      email: "Email",
      password: "Password",
      name: "Name",
      logout: "Logout",
      category: "Category",
      urgent: "Urgent",
      policy: "Policy Question",
      local: "Local Issue",
      other: "Other",
      search: "Search",
      filter: "Filter",
      public_profile: "Make my profile public (visible to others)",
      county: "County",
    },
  },
  sw: {
    translation: {
      welcome: "Karibu",
      login: "Ingia",
      register: "Jiandikishe",
      email: "Barua pepe",
      password: "Nenosiri",
      name: "Jina",
      logout: "Toka",
      category: "Kategoria",
      urgent: "Ya Dharura",
      policy: "Swali la Sera",
      local: "Swala la Kijamii",
      other: "Nyingine",
      search: "Tafuta",
      filter: "Chuja",
      public_profile: "Onyesha wasifu wangu kwa umma (uonwe na wengine)",
      county: "Kaunti",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n; 