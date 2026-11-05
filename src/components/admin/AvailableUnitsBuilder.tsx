import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { AvailableUnitsSection } from '@/services/firestore/properties';
import { createEmptyAvailableUnits } from '@/utils/propertyFormUtils';

interface AvailableUnitsBuilderProps {
  value: AvailableUnitsSection;
  onChange: (value: AvailableUnitsSection) => void;
}

const AvailableUnitsBuilder = ({ value, onChange }: AvailableUnitsBuilderProps) => {
  const section = value.categories.length > 0 || value.title
    ? value
    : createEmptyAvailableUnits();

  const updateSection = (updates: Partial<AvailableUnitsSection>) => {
    onChange({ ...section, ...updates });
  };

  const addCategory = () => {
    updateSection({
      categories: [...section.categories, { category: '', units: [{ title: '', price: '' }] }],
    });
  };

  const removeCategory = (catIndex: number) => {
    updateSection({
      categories: section.categories.filter((_, i) => i !== catIndex),
    });
  };

  const moveCategory = (catIndex: number, direction: 'up' | 'down') => {
    const categories = [...section.categories];
    const target = direction === 'up' ? catIndex - 1 : catIndex + 1;
    if (target < 0 || target >= categories.length) return;
    [categories[catIndex], categories[target]] = [categories[target], categories[catIndex]];
    updateSection({ categories });
  };

  const updateCategory = (catIndex: number, category: string) => {
    const categories = [...section.categories];
    categories[catIndex] = { ...categories[catIndex], category };
    updateSection({ categories });
  };

  const addUnit = (catIndex: number) => {
    const categories = [...section.categories];
    categories[catIndex] = {
      ...categories[catIndex],
      units: [...categories[catIndex].units, { title: '', price: '' }],
    };
    updateSection({ categories });
  };

  const removeUnit = (catIndex: number, unitIndex: number) => {
    const categories = [...section.categories];
    categories[catIndex] = {
      ...categories[catIndex],
      units: categories[catIndex].units.filter((_, i) => i !== unitIndex),
    };
    updateSection({ categories });
  };

  const moveUnit = (catIndex: number, unitIndex: number, direction: 'up' | 'down') => {
    const categories = [...section.categories];
    const units = [...categories[catIndex].units];
    const target = direction === 'up' ? unitIndex - 1 : unitIndex + 1;
    if (target < 0 || target >= units.length) return;
    [units[unitIndex], units[target]] = [units[target], units[unitIndex]];
    categories[catIndex] = { ...categories[catIndex], units };
    updateSection({ categories });
  };

  const updateUnit = (
    catIndex: number,
    unitIndex: number,
    field: 'title' | 'price',
    val: string
  ) => {
    const categories = [...section.categories];
    const units = [...categories[catIndex].units];
    units[unitIndex] = { ...units[unitIndex], [field]: val };
    categories[catIndex] = { ...categories[catIndex], units };
    updateSection({ categories });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Available Units & Prices</CardTitle>
        <p className="text-sm text-muted-foreground">
          Optional section for apartment developments. Leave empty to hide on the property page.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="unitsTitle">Section Title</Label>
          <Input
            id="unitsTitle"
            value={section.title ?? ''}
            onChange={(e) => updateSection({ title: e.target.value })}
            placeholder="Available Units & Prices"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCategory}>
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>

          {section.categories.map((cat, catIndex) => (
            <div key={catIndex} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={catIndex === 0}
                    onClick={() => moveCategory(catIndex, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={catIndex === section.categories.length - 1}
                    onClick={() => moveCategory(catIndex, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-3">
                  <Input
                    value={cat.category}
                    onChange={(e) => updateCategory(catIndex, e.target.value)}
                    placeholder="e.g., 1 Bedroom Apartments"
                  />

                  <div className="space-y-2 pl-2 border-l-2 border-muted">
                    {cat.units.map((unit, unitIndex) => (
                      <div key={unitIndex} className="flex items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={unitIndex === 0}
                            onClick={() => moveUnit(catIndex, unitIndex, 'up')}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={unitIndex === cat.units.length - 1}
                            onClick={() => moveUnit(catIndex, unitIndex, 'down')}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          className="flex-1"
                          value={unit.title}
                          onChange={(e) => updateUnit(catIndex, unitIndex, 'title', e.target.value)}
                          placeholder="Unit title, e.g., Small 1 Bedroom (43 sqm)"
                        />
                        <Input
                          className="flex-1"
                          value={unit.price}
                          onChange={(e) => updateUnit(catIndex, unitIndex, 'price', e.target.value)}
                          placeholder="Price, e.g., From Ksh 5M"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive shrink-0"
                          disabled={cat.units.length <= 1}
                          onClick={() => removeUnit(catIndex, unitIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addUnit(catIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Unit
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => removeCategory(catIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitsClosing">Closing Paragraph (Optional)</Label>
          <Textarea
            id="unitsClosing"
            rows={2}
            value={section.closingParagraph ?? ''}
            onChange={(e) => updateSection({ closingParagraph: e.target.value })}
            placeholder="Optional closing note about the units..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableUnitsBuilder;
