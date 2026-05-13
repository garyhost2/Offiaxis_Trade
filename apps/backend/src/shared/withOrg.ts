export function withOrg<T extends object>(query: T, orgId: string): T & { orgId: string } {
  return { ...query, orgId };
}
