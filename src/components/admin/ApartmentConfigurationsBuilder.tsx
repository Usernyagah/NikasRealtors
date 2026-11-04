import { useState } from "react";
import { Plus, Trash2, Bed, Bath, Maximize, Upload, Image as ImageIcon } from "lucide-react";
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
  "Apartment",
  "Penthouse",
  "Studio",
  "Duplex",
  "Townhouse",
  "Villa",
  "Mansionette",
  "Commercial Unit",
];

export const ApartmentConfigurationsBuilder = ({
  configurations,
  onChange,
}: ApartmentConfigurationsBuilderProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleAddConfig = () => {
    const newConfig: ApartmentConfiguration = {
      id: `config-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      propertyType: "Apartment",
      bedrooms: 2,
      bathrooms: 2,
      floorAreaSqFt: 1100,
      startingPrice: 12000000,
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
        return { ...item, [field]: value };
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground text-base">Apartment Configurations</h4>
          <p className="text-xs text-muted-foreground">
            Add unit layouts, sizes, starting prices, and optional floor plans.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddConfig}
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
        >
          <Plus className="h-4 w-4" /> Add Unit Configuration
        </Button>
      </div>

      {configurations.length === 0 ? (
        <div className="p-8 border border-dashed rounded-xl text-center bg-muted/20 space-y-3">
          <p className="text-sm text-muted-foreground">
            No apartment configurations added yet. Click the button below to add your first unit type.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddConfig}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add First Unit
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {configurations.map((config, index) => (
            <Card key={config.id || index} className="border border-border/80 shadow-sm relative overflow-hidden bg-card/60">
              <div className="bg-muted/40 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
                    {index + 1}
                  </span>
                  {config.bedrooms ? `${config.bedrooms} Bedroom ` : ""}{config.propertyType || "Unit"}
                  {config.startingPrice ? ` • from KES ${Number(config.startingPrice).toLocaleString()}` : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveConfig(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Property Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={config.propertyType}
                    onValueChange={(val) => handleFieldChange(index, "propertyType", val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Unit Type" />
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
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Bed className="h-3 w-3 text-muted-foreground" /> Bedrooms
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={config.bedrooms}
                    onChange={(e) => handleFieldChange(index, "bedrooms", Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Bathrooms */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Bath className="h-3 w-3 text-muted-foreground" /> Bathrooms
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    max="20"
                    value={config.bathrooms}
                    onChange={(e) => handleFieldChange(index, "bathrooms", Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Floor Area Sq Ft */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Maximize className="h-3 w-3 text-muted-foreground" /> Size (sq ft)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.floorAreaSqFt}
                    onChange={(e) => handleFieldChange(index, "floorAreaSqFt", Number(e.target.value))}
                    className="h-9"
                    placeholder="e.g. 1250"
                  />
                </div>

                {/* Starting Price */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Starting Price (KES) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.startingPrice}
                    onChange={(e) => handleFieldChange(index, "startingPrice", Number(e.target.value))}
                    className="h-9"
                    placeholder="e.g. 15000000"
                    required
                  />
                </div>

                {/* Max Price */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Price (KES) (Optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.maxPrice || ""}
                    onChange={(e) => handleFieldChange(index, "maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-9"
                    placeholder="e.g. 18500000"
                  />
                </div>

                {/* Availability Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Availability</Label>
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

                {/* Floor Plan Image */}
                <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Floor Plan</span>
                    {config.floorPlanImage && (
                      <span className="text-[10px] text-green-600 font-medium">Uploaded</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      id={`floorplan-${index}`}
                      className="hidden"
                      onChange={(e) => handleFloorPlanUpload(index, e)}
                    />
                    <label
                      htmlFor={`floorplan-${index}`}
                      className="flex-1 cursor-pointer h-9 px-3 border rounded-md flex items-center justify-center gap-1.5 text-xs bg-muted/30 hover:bg-muted transition-colors text-foreground"
                    >
                      {uploadingIndex === index ? (
                        <span>Uploading...</span>
                      ) : config.floorPlanImage ? (
                        <>
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span>Change Plan</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Upload Plan</span>
                        </>
                      )}
                    </label>
                    {config.floorPlanImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => handleFieldChange(index, "floorPlanImage", "")}
                        title="Remove floor plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Floor Plan Preview if present */}
                {config.floorPlanImage && (
                  <div className="col-span-full pt-2">
                    <div className="relative inline-block border rounded-lg overflow-hidden bg-background max-h-32">
                      <img
                        src={config.floorPlanImage}
                        alt="Floor plan"
                        className="h-28 w-auto object-contain p-1"
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
