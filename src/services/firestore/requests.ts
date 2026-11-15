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

const COLLECTION_NAME = 'requests';

export interface Request {
  id?: string;
  type?: string;
  name: string;
  email?: string;
  phone: string;
  message: string;
  property?: string;
  propertyId?: string;
  propertyTitle?: string;
  preferredUnitType?: string;
  contacted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const requestsService = {
  // Get all requests
  async getAll(filters?: {
    contacted?: boolean;
  }) {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      if (filters?.contacted !== undefined) {
        q = query(q, where('contacted', '==', filters.contacted));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Request[];
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  // Get single request
  async getById(id: string): Promise<Request | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Request;
      }
      return null;
    } catch (error) {
      console.error('Error fetching request:', error);
      throw error;
    }
  },

  // Create request (public - from contact form)
  async create(request: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'contacted'>) {
    try {
      const requestData = {
        ...Object.fromEntries(Object.entries(request).filter(([, value]) => value !== undefined)),
        contacted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), requestData);
      return { id: docRef.id, ...requestData };
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  // Update request (mark as contacted, etc.)
  async update(id: string, updates: Partial<Request>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  },

  // Delete request
  async delete(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },

  // Get statistics
  async getStats() {
    try {
      const allRequests = await this.getAll();
      const contacted = allRequests.filter(r => r.contacted).length;
      const uncontacted = allRequests.filter(r => !r.contacted).length;
      
      return {
        total: allRequests.length,
        contacted,
        uncontacted,
      };
    } catch (error) {
      console.error('Error fetching request stats:', error);
      throw error;
    }
  },
};
