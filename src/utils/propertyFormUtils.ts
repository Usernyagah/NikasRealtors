import { sanitizeText, sanitizeArray } from '@/utils/sanitize';
import { linesToArray } from '@/utils/text';
import type { AvailableUnitsSection, PaymentPlanSection } from '@/services/firestore/properties';

export interface PropertyExtendedFormData {
  description: string;
  amenities: string;
  priceType: 'exact' | 'from';
  paymentPlanTitle: string;
  paymentPlanContent: string;
  paymentPlanCash: boolean;
  paymentPlanMortgage: boolean;
  availableUnits: AvailableUnitsSection;
}

export const createEmptyAvailableUnits = (): AvailableUnitsSection => ({
  title: 'Available Units & Prices',
  closingParagraph: '',
  categories: [],
});

export const buildExtendedPropertyFields = (form: PropertyExtendedFormData) => {
  const amenitiesArray = linesToArray(form.amenities);
  const sanitizedAmenities = sanitizeArray(amenitiesArray);

  const fields: Record<string, unknown> = {
    description: sanitizeText(form.description),
    amenities: sanitizedAmenities,
    features: sanitizedAmenities,
    priceType: form.priceType,
  };

  const paymentContent = form.paymentPlanContent.trim();
  const paymentMethods: Array<'cash' | 'mortgage'> = [];
  if (form.paymentPlanCash) paymentMethods.push('cash');
  if (form.paymentPlanMortgage) paymentMethods.push('mortgage');

  if (paymentContent || paymentMethods.length > 0) {
    fields.paymentPlan = {
      title: sanitizeText(form.paymentPlanTitle.trim()) || 'Flexible Payment Plan',
      content: paymentContent ? sanitizeText(form.paymentPlanContent) : '',
      ...(paymentMethods.length > 0 ? { paymentMethods } : {}),
    } satisfies PaymentPlanSection;
  }

  const hasUnits =
    form.availableUnits.categories.length > 0 &&
    form.availableUnits.categories.some(
      (cat) => cat.category.trim() || cat.units.some((u) => u.title.trim() || u.price.trim())
    );

  if (hasUnits) {
    fields.availableUnits = {
      title: sanitizeText(form.availableUnits.title?.trim() || 'Available Units & Prices'),
      closingParagraph: form.availableUnits.closingParagraph?.trim()
        ? sanitizeText(form.availableUnits.closingParagraph)
        : undefined,
      categories: form.availableUnits.categories
        .filter((cat) => cat.category.trim() || cat.units.some((u) => u.title.trim()))
        .map((cat) => ({
          category: sanitizeText(cat.category),
          units: cat.units
            .filter((u) => u.title.trim())
            .map((u) => ({
              title: sanitizeText(u.title),
              price: sanitizeText(u.price),
            })),
        }))
        .filter((cat) => cat.units.length > 0),
    };
  }

  return fields;
};

export const hasAvailableUnitsData = (section?: AvailableUnitsSection): boolean => {
  if (!section?.categories?.length) return false;
  return section.categories.some(
    (cat) => cat.units?.some((u) => u.title?.trim())
  );
};
