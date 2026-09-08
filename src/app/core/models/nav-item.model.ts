export interface NavItem {
  label: string;
  icon: string;
  route: string;
  permissions?: string[];
  badge?: number | null;
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
