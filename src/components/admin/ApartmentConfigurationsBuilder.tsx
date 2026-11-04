import { useState } from "react";
import { Plus, Trash2, Bed, Bath, Maximize, Upload, Image as ImageIcon, Sparkles, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { firebaseStorage } from "@/services/firebaseStorage";
import { toast } from "sonner";
import type { ApartmentConfiguration } from "@/services/firestore/projects";

interface ApartmentConfigurationsBuilderProps {
  configurations: ApartmentConfiguration[];
  onChange: (configurations: ApartmentConfiguration[]) => void;
}

const PROPERTY_TYPES = [
  "Studio",
  "Apartment",
  "Penthouse",
  "Duplex",
  "Townhouse",
  "Villa",
  "Mansionette",
  "Commercial Unit",
];

// Approximate USD to KES rate for instant convenience auto-calculation
const KES_PER_USD = 129.25;

export const ApartmentConfigurationsBuilder = ({
  configurations,
  onChange,
}: ApartmentConfigurationsBuilderProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleAddConfig = (preset?: Partial<ApartmentConfiguration>) => {
    const sqm = preset?.floorAreaSqM || 65;
    const sqft = Math.round(sqm * 10.7639);
    const kesPrice = preset?.startingPrice || 6000000;
    const usd = Math.round(kesPrice / KES_PER_USD);

    const newConfig: ApartmentConfiguration = {
      id: `config-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      unitName: preset?.unitName || `${preset?.bedrooms ?? 1} Bedroom (${sqm} sqm)`,
      propertyType: preset?.propertyType || (preset?.bedrooms === 0 ? "Studio" : "Apartment"),
      bedrooms: preset?.bedrooms ?? 1,
      bathrooms: preset?.bathrooms ?? 1,
      floorAreaSqM: sqm,
      floorAreaSqFt: sqft,
      startingPrice: kesPrice,
      priceUSD: usd,
      availabilityStatus: "Available",
      floorPlanImage: "",
    };
    onChange([...configurations, newConfig]);
  };

  const handleRemoveConfig = (index: number) => {
    const updated = configurations.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index: number, field: keyof ApartmentConfiguration, value: any) => {
    const updated = configurations.map((item, i) => {
      if (i === index) {
        const next = { ...item, [field]: value };
        
        // Auto convert SqM <-> SqFt
        if (field === "floorAreaSqM" && value) {
          next.floorAreaSqFt = Math.round(Number(value) * 10.7639);
        }
        
        // Auto calculate USD when startingPrice changes (if USD wasn't manually typed)
        if (field === "startingPrice" && value) {
          next.priceUSD = Math.round(Number(value) / KES_PER_USD);
        }

        // Auto update label name if bedrooms or sqm changes
        if (field === "bedrooms" || field === "floorAreaSqM") {
          const bedLabel = next.bedrooms === 0 ? "Studio" : `${next.bedrooms} Bedroom`;
          const sqmLabel = next.floorAreaSqM ? ` (${next.floorAreaSqM} sqm)` : "";
          next.unitName = `${bedLabel}${sqmLabel}`;
        }

        return next;
      }
      return item;
    });
    onChange(updated);
  };

  const handleFloorPlanUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const url = await firebaseStorage.uploadFile(
        file,
        `projects/floorplans/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      );
      handleFieldChange(index, "floorPlanImage", url);
      toast.success("Floor plan uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload floor plan image");
    } finally {
      setUploadingIndex(null);
    }
  };

  // Quick preset loader (e.g. Luster Arbor sample units)
  const handleLoadSampleUnits = () => {
    const samples: ApartmentConfiguration[] = [
      {
        id: "sample-studio",
        unitName: "Studio (48 sqm)",
        propertyType: "Studio",
        bedrooms: 0,
        bathrooms: 1,
        floorAreaSqM: 48,
        floorAreaSqFt: 517,
        startingPrice: 4900000,
        priceUSD: 37911,
        availabilityStatus: "Available",
      },
      {
        id: "sample-1bed-63",
        unitName: "1 Bedroom (63 sqm)",
        propertyType: "Apartment",
        bedrooms: 1,
        bathrooms: 1,
        floorAreaSqM: 63,
        floorAreaSqFt: 678,
        startingPrice: 6050000,
        priceUSD: 46808,
        availabilityStatus: "Available",
      },
      {
        id: "sample-1bed-72",
        unitName: "1 Bedroom (72 sqm)",
        propertyType: "Apartment",
        bedrooms: 1,
        bathrooms: 1.5,
        floorAreaSqM: 72,
        floorAreaSqFt: 775,
        startingPrice: 6900000,
        priceUSD: 53384,
        availabilityStatus: "Available",
      },
      {
        id: "sample-2bed-85",
        unitName: "2 Bedroom (85 sqm)",
        propertyType: "Apartment",
        bedrooms: 2,
        bathrooms: 2,
        floorAreaSqM: 85,
        floorAreaSqFt: 915,
        startingPrice: 8100000,
        priceUSD: 62669,
        availabilityStatus: "Available",
      },
      {
        id: "sample-2bed-95",
        unitName: "2 Bedroom (95 sqm)",
        propertyType: "Apartment",
        bedrooms: 2,
        bathrooms: 2,
        floorAreaSqM: 95,
        floorAreaSqFt: 1022,
        startingPrice: 9100000,
        priceUSD: 70406,
        availabilityStatus: "Available",
      },
      {
        id: "sample-3bed-120",
        unitName: "3 Bedroom (120 sqm, 2 Ensuite)",
        propertyType: "Apartment",
        bedrooms: 3,
        bathrooms: 3,
        floorAreaSqM: 120,
        floorAreaSqFt: 1292,
        startingPrice: 11500000,
        priceUSD: 88975,
        availabilityStatus: "Available",
      },
      {
        id: "sample-4bed-196",
        unitName: "4 Bedroom All Ensuite + DSQ (196 sqm)",
        propertyType: "Apartment",
        bedrooms: 4,
        bathrooms: 4.5,
        floorAreaSqM: 196,
        floorAreaSqFt: 2110,
        startingPrice: 18700000,
        priceUSD: 144681,
        availabilityStatus: "Available",
      },
    ];
    onChange([...configurations, ...samples]);
    toast.success("Added unit configurations template.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-foreground text-base">Apartment Configurations & Unit Pricing</h4>
          <p className="text-xs text-muted-foreground">
            Add unit tiers with sizes (sqm & sqft), KES + USD pricing, and floor plans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {configurations.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSampleUnits}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Load Typical Tier Template
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddConfig()}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" /> Add Unit
          </Button>
        </div>
      </div>

      {configurations.length === 0 ? (
        <div className="p-8 border border-dashed rounded-xl text-center bg-muted/20 space-y-3">
          <p className="text-sm text-muted-foreground">
            No apartment configurations added yet. Add individual unit types or click below to populate standard Studio to 4-Bedroom tiers.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleLoadSampleUnits}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" /> Load Sample Unit Tiers
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddConfig()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Custom Unit
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {configurations.map((config, index) => (
            <Card key={config.id || index} className="border border-border/80 shadow-sm relative overflow-hidden bg-card/60">
              <div className="bg-muted/40 px-4 py-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span>{config.unitName || `${config.bedrooms} Bedroom ${config.propertyType}`}</span>
                  <span className="text-muted-foreground font-normal">
                    • KES {Number(config.startingPrice || 0).toLocaleString()}
                    {config.priceUSD ? ` (~$${Number(config.priceUSD).toLocaleString()})` : ""}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveConfig(index)}
                  title="Remove this configuration"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Unit Name / Title */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Unit Name / Label</Label>
                  <Input
                    value={config.unitName || ""}
                    onChange={(e) => handleFieldChange(index, "unitName", e.target.value)}
                    placeholder="e.g. 2 Bedroom (85 sqm)"
                    className="h-9"
                  />
                </div>

                {/* Property Type */}
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={config.propertyType}
                    onValueChange={(val) => handleFieldChange(index, "propertyType", val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Bed className="h-3 w-3 text-muted-foreground" /> Beds (0=Studio)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.bedrooms}
                    onChange={(e) => handleFieldChange(index, "bedrooms", Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Bathrooms */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Bath className="h-3 w-3 text-muted-foreground" /> Baths
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    max="10"
                    value={config.bathrooms}
                    onChange={(e) => handleFieldChange(index, "bathrooms", Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Availability */}
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={config.availabilityStatus}
                    onValueChange={(val: any) => handleFieldChange(index, "availabilityStatus", val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Reserved">Reserved</SelectItem>
                      <SelectItem value="Sold Out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Floor Area SqM */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Maximize className="h-3 w-3 text-muted-foreground" /> Size (m² / sqm)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.floorAreaSqM || ""}
                    onChange={(e) => handleFieldChange(index, "floorAreaSqM", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-9"
                    placeholder="e.g. 85"
                  />
                </div>

                {/* Floor Area SqFt */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                    Size (sq ft)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.floorAreaSqFt || ""}
                    onChange={(e) => handleFieldChange(index, "floorAreaSqFt", Number(e.target.value))}
                    className="h-9"
                    placeholder="e.g. 915"
                  />
                </div>

                {/* Starting Price KES */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Price (KES) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.startingPrice}
                    onChange={(e) => handleFieldChange(index, "startingPrice", Number(e.target.value))}
                    className="h-9 font-medium"
                    placeholder="e.g. 8100000"
                    required
                  />
                </div>

                {/* Price USD */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" /> USD (approx)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.priceUSD || ""}
                    onChange={(e) => handleFieldChange(index, "priceUSD", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-9"
                    placeholder="e.g. 62669"
                  />
                </div>

                {/* Floor Plan Upload */}
                <div className="space-y-1">
                  <Label className="text-xs">Floor Plan Image</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="file"
                      accept="image/*"
                      id={`floorplan-${index}`}
                      className="hidden"
                      onChange={(e) => handleFloorPlanUpload(index, e)}
                    />
                    <label
                      htmlFor={`floorplan-${index}`}
                      className="cursor-pointer flex-1 h-9 px-2 border rounded-md flex items-center justify-center gap-1 text-xs bg-muted/40 hover:bg-muted text-foreground"
                    >
                      {uploadingIndex === index ? (
                        <span>Uploading...</span>
                      ) : config.floorPlanImage ? (
                        <>
                          <ImageIcon className="h-3 w-3 text-primary" />
                          <span>Change</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 text-muted-foreground" />
                          <span>Upload</span>
                        </>
                      )}
                    </label>
                    {config.floorPlanImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-8 text-destructive"
                        onClick={() => handleFieldChange(index, "floorPlanImage", "")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Floor Plan Preview if present */}
                {config.floorPlanImage && (
                  <div className="col-span-full pt-1">
                    <div className="relative inline-block border rounded-lg overflow-hidden bg-background max-h-24">
                      <img
                        src={config.floorPlanImage}
                        alt="Floor plan"
                        className="h-20 w-auto object-contain p-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApartmentConfigurationsBuilder;
