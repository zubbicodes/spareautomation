export type CatalogProductLine = {
  slug: string;
  label: string;
  collectionHandle: string;
  keywords: string[];
};

export type CatalogCategory = {
  handle: string;
  label: string;
  description: string;
  productLines: CatalogProductLine[];
};

/**
 * The storefront catalogue contract. Shopify manual collections use these exact
 * handles; a product belongs to a storefront category when it is assigned to
 * that collection in Shopify.
 */
export const CATALOG_CATEGORIES = [
  {
    handle: "asphalt",
    label: "Asphalt / Blacktop Spares",
    description: "Burners, conveyors, drum mixer wear parts",
    productLines: [
      {
        slug: "feeders",
        label: "Aggregate Feeding",
        collectionHandle: "asphalt-aggregate-feeding",
        keywords: ["aggregate", "feeder", "feed", "conveyor", "belt", "scraper"],
      },
      {
        slug: "burner-drying",
        label: "Burner / Drying",
        collectionHandle: "burner-drying",
        keywords: ["burner", "dryer", "drying", "nozzle", "flame"],
      },
      {
        slug: "bitumen",
        label: "Bitumen",
        collectionHandle: "bitumen",
        keywords: ["bitumen", "pump", "valve", "hose"],
      },
      {
        slug: "hot-stone-silos",
        label: "Hot Storage / Silos",
        collectionHandle: "hot-storage-and-silos",
        keywords: ["hot", "stone", "silo", "storage", "bin"],
      },
      {
        slug: "baghouse",
        label: "Baghouse",
        collectionHandle: "baghouse",
        keywords: ["baghouse", "filter", "bag", "dust"],
      },
      {
        slug: "mixing-tower",
        label: "Mixing Tower",
        collectionHandle: "mixing-tower",
        keywords: ["mixing", "mixer", "tower", "liner", "drum"],
      },
    ],
  },
  {
    handle: "concrete",
    label: "Concrete Spares",
    description: "Aggregate feeding, material silos, additives, water, air and automation controls",
    productLines: [
      {
        slug: "aggregate-feeding",
        label: "Aggregate Feeding",
        collectionHandle: "concrete-aggregate-feeding",
        keywords: ["aggregate", "feeder", "feed", "hopper", "belt", "conveyor"],
      },
      {
        slug: "cement-material-silos",
        label: "Cement / Material Silos",
        collectionHandle: "cement-material-silos",
        keywords: ["cement", "material", "silo", "filter", "aerator"],
      },
      {
        slug: "additive-system",
        label: "Additive System",
        collectionHandle: "additive-system",
        keywords: ["additive", "admixture", "chemical", "dosing"],
      },
      {
        slug: "water-controls",
        label: "Water Controls",
        collectionHandle: "water-controls",
        keywords: ["water", "meter", "pump", "valve", "flow"],
      },
      {
        slug: "air-controls",
        label: "Air Controls",
        collectionHandle: "air-controls",
        keywords: ["air", "pneumatic", "compressor", "valve", "actuator"],
      },
      {
        slug: "automation-controls",
        label: "Automation Controls",
        collectionHandle: "automation-controls",
        keywords: ["automation", "control", "plc", "sensor", "panel"],
      },
    ],
  },
  {
    handle: "packing",
    label: "Packing Machinery",
    description: "Automation and sensors, bag placement, filling, discharge and palletising",
    productLines: [
      {
        slug: "automation-sensors",
        label: "Automation / Sensors",
        collectionHandle: "automation-sensors",
        keywords: [
          "automation",
          "sensor",
          "photoelectric",
          "proximity",
          "encoder",
          "detector",
          "limit switch",
          "PLC",
        ],
      },
      {
        slug: "bag-placement",
        label: "Bag Placement",
        collectionHandle: "bag-placement",
        keywords: ["bag placement", "bag placer", "bagging", "bag gripper", "bag clamp", "sack"],
      },
      {
        slug: "filling",
        label: "Filling",
        collectionHandle: "filling",
        keywords: ["filling", "filler", "dosing", "doser", "weighing", "weigher", "filling spout"],
      },
      {
        slug: "discharge-palletising",
        label: "Discharge & Palletising",
        collectionHandle: "discharge-palletising",
        keywords: [
          "discharge",
          "palletising",
          "palletizing",
          "palletiser",
          "palletizer",
          "pallet",
          "outfeed",
        ],
      },
    ],
  },
  {
    handle: "automation",
    label: "Automation & Drives",
    description: "VFDs, PLC modules, relays, sensors",
    productLines: [
      {
        slug: "contactors",
        label: "Contactors",
        collectionHandle: "contactors",
        keywords: ["contactor"],
      },
      {
        slug: "sensors",
        label: "Sensors",
        collectionHandle: "sensors",
        keywords: ["sensor", "proximity", "m18"],
      },
      {
        slug: "buttons-switches",
        label: "Buttons / Switches",
        collectionHandle: "buttons-switches",
        keywords: ["button", "pushbutton", "push button", "switch", "selector"],
      },
      {
        slug: "inverter-drives",
        label: "Inverter Drives",
        collectionHandle: "inverter-drives",
        keywords: ["inverter", "drive", "vfd", "variable frequency"],
      },
    ],
  },
  {
    handle: "home-controls",
    label: "Home Automation and Controls",
    description: "Smart relays, sensors, DIN rail supplies",
    productLines: [
      {
        slug: "lighting",
        label: "Lighting",
        collectionHandle: "lighting",
        keywords: ["lighting", "light", "lamp", "led", "dimmer"],
      },
      {
        slug: "security",
        label: "Security",
        collectionHandle: "security",
        keywords: ["security", "alarm", "camera", "cctv", "access control", "motion detector"],
      },
    ],
  },
  {
    handle: "control-panels-software",
    label: "Control Panels & Software",
    description: "Control panels, PLC software and support",
    productLines: [
      {
        slug: "control-panels",
        label: "Control Panels",
        collectionHandle: "control-panels",
        keywords: ["control panel", "panel", "cabinet", "enclosure"],
      },
      {
        slug: "software-design-programming",
        label: "Software Design and Programming",
        collectionHandle: "software-design-programming",
        keywords: ["software", "programming", "program", "plc", "hmi", "scada"],
      },
    ],
  },
] as const satisfies readonly CatalogCategory[];

export function getCatalogCategory(handle: string) {
  return CATALOG_CATEGORIES.find((category) => category.handle === handle);
}

export function getCatalogueSearch(category: string) {
  return {
    category,
    availability: "all" as const,
    sort: "newest" as const,
  };
}

export function getCatalogFilterHandle(categoryHandle: string, lineSlug?: string) {
  const category = getCatalogCategory(categoryHandle);
  return (
    category?.productLines.find((line) => line.slug === lineSlug)?.collectionHandle ??
    categoryHandle
  );
}

export function getCatalogCollections() {
  const collections = CATALOG_CATEGORIES.flatMap((category) => [
    { handle: category.handle, title: category.label, description: category.description },
    ...category.productLines.map((line) => ({
      handle: line.collectionHandle,
      title: line.label,
      description: `${line.label} products`,
    })),
  ]);

  return [...new Map(collections.map((collection) => [collection.handle, collection])).values()];
}
