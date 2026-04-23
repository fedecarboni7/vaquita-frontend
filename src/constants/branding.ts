export const APP_LOGO_LIGHT_URL = "/app-logo.png";
export const APP_LOGO_DARK_URL = "/app-logo-dark.png";

export function getAppLogoUrl(isDark: boolean): string {
	return isDark ? APP_LOGO_DARK_URL : APP_LOGO_LIGHT_URL;
}
