export function getRootNavigation(navigation: any) {
  return navigation?.getParent?.()?.getParent?.() ?? navigation?.getParent?.() ?? navigation
}
