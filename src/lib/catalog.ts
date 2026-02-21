import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions as c } from "@json-render/shadcn/catalog";

export const catalog = defineCatalog(schema, {
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
  actions: {},
});
