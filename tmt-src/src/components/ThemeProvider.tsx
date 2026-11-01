import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization } from '../types/testforge';
import { getActiveOrganization, setActiveOrganization as saveActiveOrg } from '../utils/storage';

interface ThemeContextType {
  brand: Organization;
  setBrand: (org: Organization) => void;
  updateBrandColors: (primary: string, secondary: string, name?: string, logo?: string, font?: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  brand: getActiveOrganization(),
  setBrand: () => {},
  updateBrandColors: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrandState] = useState<Organization>(getActiveOrganization());

  const setBrand = (newBrand: Organization) => {
    setBrandState(newBrand);
    saveActiveOrg(newBrand.id);
  };

  const updateBrandColors = (
    primary: string,
    secondary: string,
    name?: string,
    logo?: string,
    font?: string
  ) => {
    setBrandState((prev) => ({
      ...prev,
      primaryColor: primary,
      secondaryColor: secondary,
      name: name || prev.name,
      logoUrl: logo || prev.logoUrl,
      fontFamily: font || prev.fontFamily,
    }));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.primaryColor);
    root.style.setProperty('--brand-secondary', brand.secondaryColor);
    root.style.setProperty('--brand-font', brand.fontFamily);
    document.body.style.fontFamily = brand.fontFamily;
  }, [brand]);

  return (
    <ThemeContext.Provider value={{ brand, setBrand, updateBrandColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useBrand = () => useContext(ThemeContext);
