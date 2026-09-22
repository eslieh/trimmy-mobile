import type { BusinessProfile } from '../types/discovery';

// Shared by BusinessProfileScreen (summary count) and BusinessServicesScreen
// (full category-grouped picker) so the grouping logic can't drift apart.
export function groupServicesByCategory(services: BusinessProfile['services']) {
  const groups = new Map<string, BusinessProfile['services']>();
  for (const service of services) {
    const list = groups.get(service.categoryName) ?? [];
    list.push(service);
    groups.set(service.categoryName, list);
  }
  return Array.from(groups.entries());
}
