// Product selectors are confined to the choreography layer. Layout stays in the product.
export const LOGIN_PIECES = [
  {
    id: "story",
    label: "Welcome & branding",
    selector: ".login-story",
    primary: ".login-story h1",
  },
  {
    id: "heading",
    label: "Sign-in introduction",
    selector: ".login-form > .badge, .login-form > h2, .login-form > .muted",
    primary: ".login-form > h2",
  },
  {
    id: "email",
    label: "Work email field",
    selector: ".login-form > .field:nth-of-type(1)",
  },
  {
    id: "password",
    label: "Password field",
    selector: ".login-form > .field:nth-of-type(2)",
  },
  {
    id: "submit",
    label: "Sign-in action",
    selector: ".login-form > button[type=submit], .login-form > .fine",
    primary: ".login-form > button[type=submit]",
  },
];
export const SAMPLE_PIECE = {
  id: "sample",
  label: "QA sample-data helper",
  selector: ".login-form > button[type=button]",
};
export const SHELL_PIECES = [
  {
    id: "brand",
    label: "Header & dnata identity",
    selector: ".topbar > a",
    primary: ".topbar > a",
  },
  { id: "search", label: "Booking search", selector: ".topbar > .search" },
  {
    id: "actions",
    label: "Workspace controls",
    selector: ".topbar > .header-actions",
  },
  {
    id: "workspace",
    label: "Agency sidebar",
    selector: ".sidebar > .workspace",
  },
  {
    id: "dashboard",
    label: "Dashboard navigation",
    selector: ".sidebar > nav",
  },
  {
    id: "empty",
    label: "Intentional empty workspace",
    selector: ".main > .card",
    primary: ".main > .card h1",
  },
];
export function pieceElements(root, piece) {
  return [...root.querySelectorAll(piece.selector)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}
export function regionRect(root, piece) {
  const elements = pieceElements(root, piece);
  const primary = piece.primary && root.querySelector(piece.primary);
  return (primary || elements[0])?.getBoundingClientRect();
}
