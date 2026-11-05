import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION_NAME = 'projects';

export interface ApartmentConfiguration {
  id: string;
  unitName?: string; // e.g. "Studio (48 sqm)", "2 Bedroom (85 sqm)"
  propertyType: string; // e.g. Studio, Apartment, Penthouse, Duplex, Villa
  bedrooms: number;
  bathrooms: number;
  floorAreaSqM?: number; // Size in square meters (sqm)
  floorAreaSqFt: number; // Size in square feet
  startingPrice: number; // In KES
  priceUSD?: number; // In USD
  maxPrice?: number;
  availabilityStatus: 'Available' | 'Sold Out' | 'Reserved';
  floorPlanImage?: string;
}

export interface ProjectSEO {
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  socialSharingImage?: string;
  searchEngineIndexing: 'index' | 'noindex';
}

export interface Project {
  id?: string;
  name: string;
  slug: string;
  developer?: string;
  location: string;
  neighborhood?: string;
  county?: string;
  country?: string;
  googleMapsUrl?: string;
  shortDescription: string;
  fullDescription: string;

  // Pricing & Status
  startingPrice: number;
  status: 'published' | 'draft';
  constructionStatus: 'Planning' | 'Under Construction' | 'Nearing Completion' | 'Completed' | 'Ready to Move';
  expectedCompletionDate?: string;

  // Media
  featuredImage?: string;
  gallery: string[];
  brochureUrl?: string;

  // Features
  amenities: string[];
  paymentPlans: string[];
  nearbyLandmarks: string[];

  // Configurations
  configurations: ApartmentConfiguration[];

  // Contact
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;

  // SEO
  seo?: ProjectSEO;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date | null;
}

export const generateSensibleSEO = (project: Partial<Project>): { title: string; description: string; canonical: string } => {
  const name = project.name?.trim() || 'New Development';
  const location = project.location?.trim() || 'Nairobi, Kenya';
  const startingPrice = project.startingPrice
    ? ` from KES ${Number(project.startingPrice).toLocaleString()}`
    : '';
  
  const title = `${name} | Luxury Real Estate Project in ${location} | Nikas Realty`;
  
  const shortDesc = project.shortDescription?.trim();
  const description = shortDesc 
    ? (shortDesc.length > 155 ? `${shortDesc.slice(0, 152)}...` : shortDesc)
    : `Explore ${name} by ${project.developer || 'Nikas Realty'} in ${location}. Premium apartment units available${startingPrice}. View pricing, floor plans, and amenities.`;

  const canonical = project.slug 
    ? `https://www.nikasrealtor.com/projects/${project.slug}`
    : 'https://www.nikasrealtor.com/projects';

  return { title, description, canonical };
};

// Clean undefined fields recursively so Firestore never throws 'Unsupported field value: undefined'
const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
};

export const projectsService = {
  // Get all projects with optional filters (for admin)
  async getAll(filters?: {
    search?: string;
    status?: string;
    constructionStatus?: string;
  }) {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      if (filters?.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      try {
        q = query(q, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        let projects = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : undefined),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
            publishedAt: data.publishedAt?.toDate?.() || (data.publishedAt ? new Date(data.publishedAt) : undefined),
          };
        }) as Project[];

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          projects = projects.filter(p =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.location?.toLowerCase().includes(searchLower) ||
            p.developer?.toLowerCase().includes(searchLower)
          );
        }

        if (filters?.constructionStatus && filters.constructionStatus !== 'all') {
          projects = projects.filter(p => p.constructionStatus === filters.constructionStatus);
        }

        return projects;
      } catch (indexError: any) {
        // Fallback if index not present
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        let projects = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : undefined),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
            publishedAt: data.publishedAt?.toDate?.() || (data.publishedAt ? new Date(data.publishedAt) : undefined),
          };
        }) as Project[];

        if (filters?.status && filters.status !== 'all') {
          projects = projects.filter(p => p.status === filters.status);
        }

        projects.sort((a, b) => {
          const aDate = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) : 0;
          const bDate = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) : 0;
          return bDate - aDate;
        });

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          projects = projects.filter(p =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.location?.toLowerCase().includes(searchLower) ||
            p.developer?.toLowerCase().includes(searchLower)
          );
        }

        if (filters?.constructionStatus && filters.constructionStatus !== 'all') {
          projects = projects.filter(p => p.constructionStatus === filters.constructionStatus);
        }

        return projects;
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get published projects (for public pages)
  async getPublished(): Promise<Project[]> {
    try {
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.(),
            updatedAt: data.updatedAt?.toDate?.(),
            publishedAt: data.publishedAt?.toDate?.(),
          };
        }) as Project[];
      } catch (err) {
        // Fallback without composite index
        const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'published'));
        const querySnapshot = await getDocs(q);
        const projects = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.(),
            updatedAt: data.updatedAt?.toDate?.(),
            publishedAt: data.publishedAt?.toDate?.(),
          };
        }) as Project[];

        return projects.sort((a, b) => {
          const aDate = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) : 0;
          const bDate = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) : 0;
          return bDate - aDate;
        });
      }
    } catch (error) {
      console.error('Error fetching published projects:', error);
      throw error;
    }
  },

  // Get single project by ID
  async getById(id: string): Promise<Project | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          publishedAt: data.publishedAt?.toDate?.(),
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project by id:', error);
      throw error;
    }
  },

  // Get single project by slug
  async getBySlug(slug: string): Promise<Project | null> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          publishedAt: data.publishedAt?.toDate?.(),
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project by slug:', error);
      throw error;
    }
  },

  // Check if slug is unique (excluding an optional existing project ID)
  async isSlugUnique(slug: string, currentId?: string): Promise<boolean> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return true;
      if (currentId && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === currentId) {
        return true;
      }
      return false;
    } catch (error: any) {
      console.warn('Could not verify slug uniqueness with query (permission/index):', error?.message || error);
      // Fallback: If query fails due to security rules or permissions, allow creation to proceed
      return true;
    }
  },

  // Create project
  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>) {
    try {
      const isUnique = await this.isSlugUnique(project.slug);
      if (!isUnique) {
        throw new Error(`A project with slug "${project.slug}" already exists. Please choose a unique slug.`);
      }

      const status = project.status || 'draft';
      const projectData = {
        ...project,
        status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: status === 'published' ? Timestamp.now() : null,
      };

      const cleanedData = sanitizeForFirestore(projectData);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanedData);
      return { id: docRef.id, ...projectData };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project
  async update(id: string, updates: Partial<Project>) {
    try {
      if (updates.slug) {
        const isUnique = await this.isSlugUnique(updates.slug, id);
        if (!isUnique) {
          throw new Error(`A project with slug "${updates.slug}" already exists. Please choose a unique slug.`);
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      delete updateData.id;
      delete updateData.createdAt;

      if (updates.status === 'published' && !updates.publishedAt) {
        const currentDoc = await getDoc(docRef);
        if (currentDoc.exists() && !currentDoc.data().publishedAt) {
          updateData.publishedAt = Timestamp.now();
        }
      }

      const cleanedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, cleanedUpdate);
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Toggle publish status
  async togglePublish(id: string, currentStatus: 'published' | 'draft') {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    return await this.update(id, { status: newStatus });
  },

  // Delete project
  async delete(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};

