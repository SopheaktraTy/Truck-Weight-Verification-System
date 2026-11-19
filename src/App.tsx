import React, { useState, useEffect, useMemo } from 'react';
import { Company, Product, LineItemState, TruckRecord, TruckRecordItem } from './types';
import { INITIAL_COMPANIES, INITIAL_PRODUCTS, INITIAL_RECORDS } from './lib/mockData';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { verifyTruckWeight, VerificationResult } from './lib/calculator';
import { deleteImage } from './lib/storage';
import { useAuth } from './context/AuthContext';

import { Header } from './components/Header';
import { CompanySelector } from './components/CompanySelector';
import { TruckInfoForm } from './components/TruckInfoForm';
import { LineItemsTable } from './components/LineItemsTable';
import { ScaleEntryCard } from './components/ScaleEntryCard';
import { VerificationBadge } from './components/VerificationBadge';
import { ReportTable } from './components/ReportTable';
import { CompanyModal } from './components/CompanyModal';
import { ProductModal } from './components/ProductModal';
import { ProductManagementModal } from './components/ProductManagementModal';
import { SaveConfirmationModal } from './components/SaveConfirmationModal';
import { EditRecordModal } from './components/EditRecordModal';
import { AuthModal } from './components/AuthModal';

const toValidUUIDOrNull = (id?: string | null): string | null => {
  if (!id) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
};

export function App() {
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [lang, setLang] = useState<'km' | 'en'>('km');

  // Auth & RBAC
  const { user, profile, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Master Data
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [records, setRecords] = useState<TruckRecord[]>(INITIAL_RECORDS);

  // Modal State for Company and Product Editing/Creation
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isProductManagementOpen, setIsProductManagementOpen] = useState<boolean>(false);

  // Modal State for Truck Record Editing (Admin Only)
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<TruckRecord | null>(null);

  // Save Confirmation Popup Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0]?.id || '');
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recordTime, setRecordTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [operatorName, setOperatorName] = useState<string>('');
  const [scaleInKg, setScaleInKg] = useState<number>(0);
  const [scaleOutKg, setScaleOutKg] = useState<number>(0);
  const [tolerancePercent, setTolerancePercent] = useState<number>(0.40);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Synchronize operator name from logged in profile
  useEffect(() => {
    if (profile?.full_name) {
      setOperatorName(profile.full_name);
    }
  }, [profile]);

  // Currently active company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  // Filter products for the chosen company
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.company_id === selectedCompanyId);
  }, [products, selectedCompanyId]);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);

  // Reset line items whenever selected company changes
  useEffect(() => {
    setLineItems([]);
  }, [selectedCompanyId]);

  // Fetch data from Supabase if configured
  const loadFromSupabase = async (isManualSync = false) => {
    if (!isSupabaseConfigured || !supabase) {
      if (isManualSync) {
        setSaveNotification(
          lang === 'km'
            ? 'ℹ️ កំពុងដំណើរការក្នុង Demo Mode (សូមភ្ជាប់ Supabase ក្នុង .env)'
            : 'ℹ️ Running in Demo Mode (Connect Supabase in .env to sync cloud data)'
        );
        setTimeout(() => setSaveNotification(null), 3500);
      }
      return;
    }

    try {
      setIsRefreshing(true);

      // 1. Fetch Companies
      const { data: dbCompanies, error: compErr } = await supabase.from('companies').select('*');
      if (compErr) throw compErr;
      if (dbCompanies && dbCompanies.length > 0) {
        setCompanies(dbCompanies);
        setSelectedCompanyId((current) => {
          if (!current || !dbCompanies.some((c) => c.id === current)) {
            return dbCompanies[0].id;
          }
          return current;
        });
      }

      // 2. Fetch Products
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('display_order');
      if (prodErr) throw prodErr;
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
      }

      // 3. Fetch Truck Records WITH Line Items snapshot relations and joined product master data
      const { data: dbRecords, error: recErr } = await supabase
        .from('truck_records')
        .select('*, companies(code, logo_url, name), items:truck_record_items(*, product:products(*))')
        .order('created_at', { ascending: false });
      if (recErr) throw recErr;

      if (dbRecords) {
        const mapped: TruckRecord[] = dbRecords.map((r: any) => ({
          ...r,
          company_code: r.companies?.code,
          company_logo: r.companies?.logo_url,
          company_name: r.companies?.name,
          items: r.items || [],
        }));
        setRecords(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-sync
  useEffect(() => {
    loadFromSupabase(false);

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truck_records' }, () => {
        loadFromSupabase(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        loadFromSupabase(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadFromSupabase(false);
      })
      .subscribe();

    const interval = setInterval(() => {
      loadFromSupabase(false);
    }, 20000);

    const handleFocus = () => {
      loadFromSupabase(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle adding an empty item row
  const handleAddItem = () => {
    const newItem: LineItemState = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: '',
      productNameKh: '',
      productNameEn: '',
      packagingSpec: '',
      unit: '',
      unitWeightKg: 0,
      quantity: 0,
      totalWeightKg: 0,
      totalWeightTon: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  // Handle removing a row
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle product selection in a row
  const handleProductChange = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId) || null;
    if (!product) {
      setLineItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            productId: '',
            productNameKh: '',
            productNameEn: '',
            packagingSpec: '',
            unit: '',
            unitWeightKg: 0,
            imageUrl: '',
            totalWeightKg: 0,
            totalWeightTon: 0,
          };
        })
      );
      return;
    }

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const totalKg = Math.round(item.quantity * product.unit_weight_kg * 1000) / 1000;
        return {
          ...item,
          productId: product.id,
          productNameKh: product.name_kh,
          productNameEn: product.name_en,
          packagingSpec: product.packaging_spec,
          unit: product.unit,
          unitWeightKg: product.unit_weight_kg,
          imageUrl: product.image_url,
          totalWeightKg: totalKg,
          totalWeightTon: Math.round((totalKg / 1000) * 10000) / 10000,
        };
      })
    );
  };

  // Handle quantity input change
  const handleQuantityChange = (id: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const totalKg = Math.round(qty * item.unitWeightKg * 1000) / 1000;
        return {
          ...item,
          quantity: qty,
          totalWeightKg: totalKg,
          totalWeightTon: Math.round((totalKg / 1000) * 10000) / 10000,
        };
      })
    );
  };

  // Calculate live verification metrics with manual tolerance
  const calculationResult: VerificationResult = useMemo(() => {
    const rawItems = lineItems.map((i) => ({
      productId: i.productId,
      productNameKh: i.productNameKh,
      productNameEn: i.productNameEn,
      quantity: i.quantity,
      unitWeightKg: i.unitWeightKg,
    }));

    return verifyTruckWeight(scaleInKg, scaleOutKg, rawItems, tolerancePercent);
  }, [scaleInKg, scaleOutKg, lineItems, tolerancePercent]);

  // Handle Reset Form
  const handleResetForm = () => {
    setScaleInKg(0);
    setScaleOutKg(0);
    setPlateNumber('');
    setLineItems([]);
    setRecordTime(new Date().toTimeString().slice(0, 5));
  };

  // Step 1: When user clicks Save -> open Summary Confirmation Popup
  const handleInitiateSave = () => {
    if (!plateNumber.trim()) {
      alert(lang === 'km' ? 'សូមបញ្ចូលផ្លាកលេខឡានជាមុនសិន!' : 'Please enter truck plate number!');
      return;
    }

    if (calculationResult.scaleNetKg <= 0 && calculationResult.warehouseTotalKg <= 0) {
      alert(lang === 'km' ? 'សូមបញ្ចូលទម្ងន់ជញ្ជីង ឬចំនួនទំនិញ!' : 'Please enter scale weights or item quantities!');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Step 2: Save to Database with historic snapshots
  const handleConfirmSave = async () => {
    setIsSaving(true);
    const newRecord: TruckRecord = {
      id: `rec-${Date.now()}`,
      plate_number: plateNumber,
      company_id: selectedCompanyId,
      company_code: selectedCompany?.code || 'HB',
      company_name: selectedCompany?.name,
      company_logo: selectedCompany?.logo_url,
      record_date: recordDate,
      record_time: recordTime,
      scale_in_kg: calculationResult.scaleInKg,
      scale_out_kg: calculationResult.scaleOutKg,
      scale_net_kg: calculationResult.scaleNetKg,
      warehouse_total_kg: calculationResult.warehouseTotalKg,
      diff_kg: calculationResult.diffKg,
      diff_percent: calculationResult.diffPercent,
      tolerance_percent: tolerancePercent,
      status: calculationResult.status,
      status_message: calculationResult.statusMessage,
      operator_id: user?.id,
      operator_name: operatorName || profile?.full_name || 'Operator',
      created_at: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured && supabase) {
        const { data: recordData, error: recordError } = await supabase
          .from('truck_records')
          .insert({
            plate_number: newRecord.plate_number,
            company_id: newRecord.company_id,
            record_date: newRecord.record_date,
            record_time: newRecord.record_time || null,
            scale_in_kg: newRecord.scale_in_kg,
            scale_out_kg: newRecord.scale_out_kg,
            scale_net_kg: newRecord.scale_net_kg,
            warehouse_total_kg: newRecord.warehouse_total_kg,
            diff_kg: newRecord.diff_kg,
            diff_percent: newRecord.diff_percent,
            tolerance_percent: newRecord.tolerance_percent,
            status: newRecord.status,
            status_message: newRecord.status_message,
            operator_id: toValidUUIDOrNull(newRecord.operator_id),
            operator_name: newRecord.operator_name,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        newRecord.id = recordData.id;

        // Snapshot all line item details so future product updates don't distort history
        const childItems = lineItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            record_id: recordData.id,
            product_id: i.productId || null,
            product_name_kh: i.productNameKh,
            product_name_en: i.productNameEn,
            packaging_spec: i.packagingSpec,
            unit: i.unit,
            image_url: i.imageUrl,
            quantity: i.quantity,
            unit_weight_kg: i.unitWeightKg,
            total_weight_kg: i.totalWeightKg,
            total_weight_ton: i.totalWeightTon,
          }));

        if (childItems.length > 0) {
          const { error: itemsError } = await supabase.from('truck_record_items').insert(childItems);
          if (itemsError) throw itemsError;
        }

        newRecord.items = childItems as any;
      } else {
        // In local mode, attach items snapshot
        newRecord.items = lineItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            product_id: i.productId,
            product_name_kh: i.productNameKh,
            product_name_en: i.productNameEn,
            packaging_spec: i.packagingSpec,
            unit: i.unit,
            image_url: i.imageUrl,
            quantity: i.quantity,
            unit_weight_kg: i.unitWeightKg,
            total_weight_kg: i.totalWeightKg,
            total_weight_ton: i.totalWeightTon,
          }));
      }

      setRecords((prev) => [newRecord, ...prev]);

      setSaveNotification(
        lang === 'km'
          ? `✅ បានរក្សាទុកទិន្នន័យរថយន្ត ${newRecord.plate_number} (${newRecord.status}) ជោគជ័យ!`
          : `✅ Successfully saved truck record ${newRecord.plate_number} (${newRecord.status})!`
      );

      setIsConfirmModalOpen(false);
      handleResetForm();
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err: any) {
      console.error('Error saving record:', err);
      alert('Failed to save to Supabase: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Admin Truck Record CRUD (Edit & Delete) ───────────────────────────────

  const handleEditRecord = (record: TruckRecord) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីកែប្រែកំណត់ត្រា!' : 'Admin privilege required to edit records!');
      return;
    }
    setEditingRecord(record);
    setIsEditRecordModalOpen(true);
  };

  const handleSaveEditedRecord = async (updatedRecord: TruckRecord, updatedItems: TruckRecordItem[]) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារ!' : 'Admin privilege required!');
      return;
    }

    try {
      if (isSupabaseConfigured && supabase && updatedRecord.id) {
        // 1. Update truck_records header
        const { error: recErr } = await supabase
          .from('truck_records')
          .update({
            plate_number: updatedRecord.plate_number,
            record_date: updatedRecord.record_date,
            record_time: updatedRecord.record_time || null,
            scale_in_kg: updatedRecord.scale_in_kg,
            scale_out_kg: updatedRecord.scale_out_kg,
            scale_net_kg: updatedRecord.scale_net_kg,
            warehouse_total_kg: updatedRecord.warehouse_total_kg,
            diff_kg: updatedRecord.diff_kg,
            diff_percent: updatedRecord.diff_percent,
            tolerance_percent: updatedRecord.tolerance_percent ?? 0.40,
            status: updatedRecord.status,
            status_message: updatedRecord.status_message,
            operator_name: updatedRecord.operator_name,
            driver_name: updatedRecord.driver_name,
            notes: updatedRecord.notes,
            updated_by: profile?.full_name || user?.email || 'Admin',
            updated_by_id: toValidUUIDOrNull(user?.id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedRecord.id);

        if (recErr) throw recErr;

        // 2. Replace child items
        await supabase.from('truck_record_items').delete().eq('record_id', updatedRecord.id);

        const itemsToInsert = updatedItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            record_id: updatedRecord.id,
            product_id: i.product_id || null,
            product_name_kh: i.product_name_kh,
            product_name_en: i.product_name_en,
            packaging_spec: i.packaging_spec,
            unit: i.unit,
            image_url: i.image_url,
            quantity: i.quantity,
            unit_weight_kg: i.unit_weight_kg,
            total_weight_kg: i.total_weight_kg,
            total_weight_ton: i.total_weight_ton,
          }));

        if (itemsToInsert.length > 0) {
          const { error: itemsErr } = await supabase.from('truck_record_items').insert(itemsToInsert);
          if (itemsErr) throw itemsErr;
        }
      }

      setRecords((prev) =>
        prev.map((r) =>
          r.id === updatedRecord.id ? { ...updatedRecord, items: updatedItems } : r
        )
      );

      setSaveNotification(
        lang === 'km'
          ? `✅ បានកែប្រែកំណត់ត្រា ${updatedRecord.plate_number} ជោគជ័យ!`
          : `✅ Record ${updatedRecord.plate_number} updated successfully!`
      );
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err: any) {
      console.error('Error updating record:', err);
      alert('Failed to update record: ' + (err.message || err));
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីលុបកំណត់ត្រា!' : 'Admin privilege required to delete records!');
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        // Delete child items first to ensure foreign key safety
        await supabase.from('truck_record_items').delete().eq('record_id', recordId);
        const { error } = await supabase.from('truck_records').delete().eq('id', recordId);
        if (error) throw error;
      }

      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setSaveNotification(
        lang === 'km' ? '🗑️ បានលុបកំណត់ត្រាជោគជ័យ!' : '🗑️ Record deleted successfully!'
      );
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record: ' + (err.message || err));
    }
  };

  // ── Company CRUD (Admin Only) ─────────────────────────────────────────────

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីកែប្រែក្រុមហ៊ុន!' : 'Admin privilege required to modify companies!');
      return;
    }

    try {
      if (companyData.id) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('companies')
            .update({
              code: companyData.code,
              name: companyData.name,
              description: companyData.description,
              logo_url: companyData.logo_url,
            })
            .eq('id', companyData.id);
          if (error) throw error;
        }

        setCompanies((prev) =>
          prev.map((c) => (c.id === companyData.id ? ({ ...c, ...companyData } as Company) : c))
        );
        setSaveNotification(
          lang === 'km' ? '✅ បានកែប្រែក្រុមហ៊ុនជោគជ័យ!' : '✅ Company updated successfully!'
        );
        setTimeout(() => setSaveNotification(null), 3000);
      } else {
        let newCompany: Company;
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('companies')
            .insert({
              code: companyData.code,
              name: companyData.name,
              description: companyData.description,
              logo_url: companyData.logo_url,
            })
            .select()
            .single();

          if (error) throw error;
          newCompany = data;
        } else {
          newCompany = {
            id: `c-${Date.now()}`,
            code: companyData.code ?? '',
            name: companyData.name ?? '',
            description: companyData.description,
            logo_url: companyData.logo_url,
          };
        }

        setCompanies((prev) => [...prev, newCompany]);
        setSelectedCompanyId(newCompany.id);
        setSaveNotification(
          lang === 'km' ? '✅ បានបង្កើតក្រុមហ៊ុនថ្មីជោគជ័យ!' : '✅ New company created successfully!'
        );
        setTimeout(() => setSaveNotification(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving company:', err);
      alert('Error saving company: ' + (err.message || err));
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីលុបក្រុមហ៊ុន!' : 'Admin privilege required to delete companies!');
      return;
    }

    if (companies.length <= 1) {
      alert(lang === 'km' ? 'មិនអាចលុបក្រុមហ៊ុនចុងក្រោយបានទេ!' : 'Cannot delete the only remaining company!');
      return;
    }

    const companyToDelete = companies.find((c) => c.id === companyId);
    if (!companyToDelete) return;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('companies').delete().eq('id', companyId);
        if (error) throw error;
      }

      if (companyToDelete.logo_url) {
        deleteImage(companyToDelete.logo_url);
      }

      const nextCompanies = companies.filter((c) => c.id !== companyId);
      setCompanies(nextCompanies);
      if (selectedCompanyId === companyId && nextCompanies.length > 0) {
        setSelectedCompanyId(nextCompanies[0].id);
      }

      setSaveNotification(
        lang === 'km'
          ? `🗑️ បានលុបក្រុមហ៊ុន ${companyToDelete.name} ជោគជ័យ!`
          : `🗑️ Company ${companyToDelete.name} deleted successfully!`
      );
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err: any) {
      console.error('Error deleting company:', err);
      alert('Failed to delete company: ' + (err.message || err));
    }
  };

  // ── Product CRUD (Admin Only) ─────────────────────────────────────────────

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីកែប្រែទំនិញ!' : 'Admin privilege required to modify products!');
      return;
    }

    try {
      if (productData.id) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('products')
            .update({
              name_kh: productData.name_kh,
              name_en: productData.name_en,
              packaging_spec: productData.packaging_spec,
              unit: productData.unit,
              unit_weight_kg: productData.unit_weight_kg,
              image_url: productData.image_url,
              display_order: productData.display_order ?? 10,
            })
            .eq('id', productData.id);
          if (error) throw error;
        }

        setProducts((prev) =>
          prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p))
        );

        // Update current active lineItems if matching
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.productId !== productData.id) return item;
            const unitWeight = productData.unit_weight_kg ?? item.unitWeightKg;
            const totalKg = Math.round(item.quantity * unitWeight * 1000) / 1000;
            return {
              ...item,
              productNameKh: productData.name_kh ?? item.productNameKh,
              productNameEn: productData.name_en ?? item.productNameEn,
              packagingSpec: productData.packaging_spec ?? item.packagingSpec,
              unit: productData.unit ?? item.unit,
              unitWeightKg: unitWeight,
              imageUrl: productData.image_url ?? item.imageUrl,
              totalWeightKg: totalKg,
              totalWeightTon: Math.round((totalKg / 1000) * 10000) / 10000,
            };
          })
        );

        setSaveNotification(
          lang === 'km' ? '✅ បានកែប្រែទំនិញជោគជ័យ!' : '✅ Product updated successfully!'
        );
        setTimeout(() => setSaveNotification(null), 3000);
      } else {
        let newProduct: Product;
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('products')
            .insert({
              company_id: productData.company_id,
              name_kh: productData.name_kh,
              name_en: productData.name_en,
              packaging_spec: productData.packaging_spec,
              unit: productData.unit,
              unit_weight_kg: productData.unit_weight_kg,
              image_url: productData.image_url,
              display_order: productData.display_order ?? 10,
            })
            .select()
            .single();

          if (error) throw error;
          newProduct = data;
        } else {
          newProduct = {
            id: `p-${Date.now()}`,
            company_id: productData.company_id!,
            name_kh: productData.name_kh ?? '',
            name_en: productData.name_en ?? '',
            packaging_spec: productData.packaging_spec ?? '',
            unit: productData.unit ?? '',
            unit_weight_kg: productData.unit_weight_kg ?? 0,
            image_url: productData.image_url,
            display_order: productData.display_order ?? 10,
          };
        }

        setProducts((prev) => [...prev, newProduct]);
        setSaveNotification(
          lang === 'km' ? '✅ បានបន្ថែមមុខទំនិញថ្មីជោគជ័យ!' : '✅ New product added successfully!'
        );
        setTimeout(() => setSaveNotification(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert('Error saving product: ' + (err.message || err));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!isAdmin) {
      alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីលុបទំនិញ!' : 'Admin privilege required to delete products!');
      return;
    }

    const productToDelete = products.find((p) => p.id === productId);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
      }

      if (productToDelete?.image_url) {
        deleteImage(productToDelete.image_url);
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setLineItems((prev) => prev.filter((item) => item.productId !== productId));

      setSaveNotification(
        lang === 'km' ? '🗑️ បានលុបមុខទំនិញជោគជ័យ!' : '🗑️ Product deleted successfully!'
      );
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product: ' + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'report') {
            loadFromSupabase(false);
          }
        }}
        lang={lang}
        setLang={setLang}
        isRefreshing={isRefreshing}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Save / Sync Notification Banner */}
      {saveNotification && (
        <div className="bg-emerald-600 text-white text-center py-2.5 px-4 font-bold text-xs sm:text-sm shadow-md animate-bounce sticky top-16 z-20">
          {saveNotification}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {activeTab === 'entry' && (
          <div className="space-y-6">
            {/* Top Row: Company Selector & Truck Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompanySelector
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
                isAdmin={isAdmin}
                onAddCompany={() => {
                  if (!isAdmin) {
                    alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីបន្ថែមក្រុមហ៊ុន!' : 'Admin privilege required to add companies!');
                    return;
                  }
                  setEditingCompany(null);
                  setIsCompanyModalOpen(true);
                }}
                onEditCompany={(companyToEdit) => {
                  if (!isAdmin) {
                    alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីកែប្រែក្រុមហ៊ុន!' : 'Admin privilege required to edit companies!');
                    return;
                  }
                  setEditingCompany(companyToEdit);
                  setIsCompanyModalOpen(true);
                }}
                onDeleteCompany={handleDeleteCompany}
                lang={lang}
              />
              <TruckInfoForm
                plateNumber={plateNumber}
                setPlateNumber={setPlateNumber}
                recordDate={recordDate}
                setRecordDate={setRecordDate}
                recordTime={recordTime}
                setRecordTime={setRecordTime}
                operatorName={operatorName}
                setOperatorName={setOperatorName}
                lang={lang}
              />
            </div>

            {/* Middle: Line Items Table */}
            <LineItemsTable
              items={lineItems}
              availableProducts={availableProducts}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onProductChange={handleProductChange}
              onQuantityChange={handleQuantityChange}
              isAdmin={isAdmin}
              onAddNewProduct={() => {
                if (!isAdmin) {
                  alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីគ្រប់គ្រងមុខទំនិញ!' : 'Admin privilege required to manage products!');
                  return;
                }
                setIsProductManagementOpen(true);
              }}
              onEditProduct={(productToEdit) => {
                if (!isAdmin) {
                  alert(lang === 'km' ? 'សិទ្ធិជា Admin ត្រូវបានទាមទារដើម្បីកែប្រែមុខទំនិញ!' : 'Admin privilege required to edit products!');
                  return;
                }
                setEditingProduct(productToEdit);
                setIsProductModalOpen(true);
              }}
              totalWarehouseKg={calculationResult.warehouseTotalKg}
              lang={lang}
            />

            {/* Bottom: Scale Input and Verification Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScaleEntryCard
                scaleInKg={scaleInKg}
                setScaleInKg={setScaleInKg}
                scaleOutKg={scaleOutKg}
                setScaleOutKg={setScaleOutKg}
                scaleNetKg={calculationResult.scaleNetKg}
                lang={lang}
              />
              <VerificationBadge
                result={calculationResult}
                tolerancePercent={tolerancePercent}
                onToleranceChange={setTolerancePercent}
                onSave={handleInitiateSave}
                onReset={handleResetForm}
                isSaving={isSaving}
                lang={lang}
              />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <ReportTable
            records={records}
            companies={companies}
            products={products}
            lang={lang}
            isAdmin={isAdmin}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* Modals for Company and Product Management (Admin Only) */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setEditingCompany(null);
        }}
        onSave={handleSaveCompany}
        initialCompany={editingCompany}
        lang={lang}
      />

      <ProductManagementModal
        isOpen={isProductManagementOpen}
        onClose={() => setIsProductManagementOpen(false)}
        company={selectedCompany}
        products={availableProducts}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        lang={lang}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        company={selectedCompany}
        initialProduct={editingProduct}
        lang={lang}
      />

      {/* Admin Truck Record Edit Modal */}
      <EditRecordModal
        record={editingRecord}
        companies={companies}
        products={products}
        isOpen={isEditRecordModalOpen}
        onClose={() => {
          setIsEditRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveEditedRecord}
        lang={lang}
      />

      {/* Review & Confirmation Popup Modal */}
      <SaveConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        plateNumber={plateNumber}
        company={selectedCompany}
        recordDate={recordDate}
        recordTime={recordTime}
        operatorName={operatorName}
        scaleInKg={scaleInKg}
        scaleOutKg={scaleOutKg}
        calculationResult={calculationResult}
        lineItems={lineItems}
        lang={lang}
      />

      {/* Auth & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          Truck Weight Verification System • Based on Excel logic (តារាងគណនាទម្ងន់ទំនិញក្នុងរថយន្ត.xlsm) • Powered by Supabase, Vercel & n8n
        </p>
      </footer>
    </div>
  );
}

export default App;
