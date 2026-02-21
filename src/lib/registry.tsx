import { defineRegistry } from "@json-render/react";
import { shadcnComponents as c } from "@json-render/shadcn";
import { catalog } from "./catalog";

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: c.Card,
    Heading: c.Heading,
    Text: c.Text,
    Stack: c.Stack,
    Grid: c.Grid,
    Table: c.Table,
    Badge: c.Badge,
    Accordion: c.Accordion,
    Alert: c.Alert,
    Separator: c.Separator,
    Button: c.Button,
    Progress: c.Progress,
    Tabs: c.Tabs,
    Checkbox: c.Checkbox,
    Switch: c.Switch,
    Input: c.Input,
    Collapsible: c.Collapsible,
  },
});
