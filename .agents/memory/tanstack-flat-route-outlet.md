---
name: TanStack flat-route list/detail rendering
description: In this workspace's TanStack Router UIs, a list route is the layout parent of its $id route; detail pages render only through an Outlet.
---

With flat file routes, `foo.tsx` becomes the layout parent of `foo.$id.tsx`. If the list component never renders `<Outlet />`, every detail URL silently shows the list page instead.

**How to apply:** For any new list+detail route pair, either name the list `foo.index.tsx`, or guard the list component with `useChildMatches().length > 0 ? <Outlet /> : <List />`.
