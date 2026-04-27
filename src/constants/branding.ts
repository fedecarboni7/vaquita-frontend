export const VAQUITA_LOGO_LIGHT_URL = "/vaquita-logo-light.png";
export const VAQUITA_LOGO_DARK_URL = "/vaquita-logo-dark.png";
export const VAQUITA_LOGO_LIGHT_WORDMARK_URL = "/vaquita-logo-light-wordmark.png";
export const VAQUITA_LOGO_DARK_WORDMARK_URL = "/vaquita-logo-dark-wordmark.png";

export function getAppLogoUrl(isDark: boolean): string {
	return isDark ? VAQUITA_LOGO_DARK_URL : VAQUITA_LOGO_LIGHT_URL;
}

export function getAppWordmarkUrl(isDark: boolean): string {
	return isDark ? VAQUITA_LOGO_DARK_WORDMARK_URL : VAQUITA_LOGO_LIGHT_WORDMARK_URL;
}
