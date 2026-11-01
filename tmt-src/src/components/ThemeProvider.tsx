import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization } from '../types/testforge';
import { getActiveOrganization, saveBrand } from '../utils/storage';

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

/**
 * Applies a company's branding. Staff screens load it from the company record and save edits back
 * (`persist`). The candidate link supplies the same branding from the invite (`initialBrand`, not editable).
 */
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialBrand?: Organization;
  persist?: boolean;
}> = ({ children, initialBrand, persist = true }) => {
  const [brand, setBrandState] = useState<Organization>(initialBrand ?? getActiveOrganization());

  const setBrand = (next: Organization) => {
    setBrandState(next);
    if (persist) saveBrand(next);
  };

  const updateBrandColors = (primary: string, secondary: string, name?: string, logo?: string, font?: string) => {
    const next: Organization = {
      ...brand,
      primaryColor: primary,
      secondaryColor: secondary,
      name: name || brand.name,
      logoUrl: logo ?? brand.logoUrl,
      fontFamily: font || brand.fontFamily,
    };
    setBrand(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.primaryColor);
    root.style.setProperty('--brand-secondary', brand.secondaryColor);
    root.style.setProperty('--brand-font', brand.fontFamily);
    document.body.style.fontFamily = brand.fontFamily;
  }, [brand]);

  return <ThemeContext.Provider value={{ brand, setBrand, updateBrandColors }}>{children}</ThemeContext.Provider>;
};

export const useBrand = () => useContext(ThemeContext);
