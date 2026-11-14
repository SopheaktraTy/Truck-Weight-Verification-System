import React, { useState, useEffect, useMemo } from 'react';
import { Company, Product, LineItemState, TruckRecord } from './types';
import { INITIAL_COMPANIES, INITIAL_PRODUCTS, INITIAL_RECORDS } from './lib/mockData';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { verifyTruckWeight, VerificationResult } from './lib/calculator';
import { deleteImage } from './lib/storage';

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

export function App() {
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [lang, setLang] = useState<'km' | 'en'>('km');

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

  // Save Confirmation Popup Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[1]?.id || '');
  const [plateNumber, setPlateNumber] = useState<string>('3G-2487');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [operatorName, setOperatorName] = useState<string>('Sopheaktra');
  const [scaleInKg, setScaleInKg] = useState<number>(12500);
  const [scaleOutKg, setScaleOutKg] = useState<number>(29630);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Currently active company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  // Filter products for the chosen company
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.company_id === selectedCompanyId);
  }, [products, selectedCompanyId]);

  // Line items state (starts empty so user clicks "+ បន្ថែមជួរ" to add items as needed)
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

      // 3. Fetch Truck Records
      const { data: dbRecords, error: recErr } = await supabase
        .from('truck_records')
        .select('*, companies(code, logo_url, name)')
        .order('created_at', { ascending: false });
      if (recErr) throw recErr;

      if (dbRecords) {
        const mapped: TruckRecord[] = dbRecords.map((r: any) => ({
          ...r,
          company_code: r.companies?.code,
          company_logo: r.companies?.logo_url,
          company_name: r.companies?.name,
        }));
        setRecords(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-sync: Initial load, Supabase Realtime channel, periodic background polling, and window focus
  useEffect(() => {
    loadFromSupabase(false);

    if (!isSupabaseConfigured || !supabase) return;

    // 1. Supabase Realtime Subscription for live instant updates across devices
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

    // 2. Periodic background auto-sync every 20 seconds
    const interval = setInterval(() => {
      loadFromSupabase(false);
    }, 20000);

    // 3. Auto-sync whenever user returns to or focuses the window
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

  // Handle adding an empty item row (starts blank so user selects product)
  const handleAddItem = () => {
    const newItem: LineItemState = {
      id: `item-${Date.now()}`,
      productId: '',
      productNameKh: '',
      productNameEn: '',
      packagingSpec: '',
      unit: '',
      unitWeightKg: 0,
      imageUrl: '',
      quantity: 0,
      totalWeightKg: 0,
      totalWeightTon: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  // Handle removing a row
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Handle product dropdown change
  const handleProductChange = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
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

  // Calculate live verification metrics
  const calculationResult: VerificationResult = useMemo(() => {
    const rawItems = lineItems.map((i) => ({
      productId: i.productId,
      productNameKh: i.productNameKh,
      productNameEn: i.productNameEn,
      quantity: i.quantity,
      unitWeightKg: i.unitWeightKg,
    }));

    return verifyTruckWeight(scaleInKg, scaleOutKg, rawItems);
  }, [scaleInKg, scaleOutKg, lineItems]);

  // Handle Reset Form
  const handleResetForm = () => {
    setScaleInKg(0);
    setScaleOutKg(0);
    setPlateNumber('');
    setLineItems([]);
  };

  // Step 1: When user clicks Save in verification badge -> open Summary Confirmation Popup!
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

  // Step 2: When user confirms in the Summary Confirmation Popup -> save directly to DB!
  const handleConfirmSave = async () => {
    setIsSaving(true);
    const newRecord: TruckRecord = {
      id: `rec-${Date.now()}`,
      plate_number: plateNumber,
      company_id: selectedCompanyId,
      company_code: selectedCompany?.code || 'HB',
      record_date: recordDate,
      scale_in_kg: calculationResult.scaleInKg,
      scale_out_kg: calculationResult.scaleOutKg,
      scale_net_kg: calculationResult.scaleNetKg,
      warehouse_total_kg: calculationResult.warehouseTotalKg,
      diff_kg: calculationResult.diffKg,
      diff_percent: calculationResult.diffPercent,
      status: calculationResult.status,
      status_message: calculationResult.statusMessage,
      operator_name: operatorName,
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
            scale_in_kg: newRecord.scale_in_kg,
            scale_out_kg: newRecord.scale_out_kg,
            scale_net_kg: newRecord.scale_net_kg,
            warehouse_total_kg: newRecord.warehouse_total_kg,
            diff_kg: newRecord.diff_kg,
            diff_percent: newRecord.diff_percent,
            status: newRecord.status,
            status_message: newRecord.status_message,
            operator_name: newRecord.operator_name,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        newRecord.id = recordData.id;

        const childItems = lineItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            record_id: recordData.id,
            product_id: i.productId,
            quantity: i.quantity,
            unit_weight_kg: i.unitWeightKg,
            total_weight_kg: i.totalWeightKg,
            total_weight_ton: i.totalWeightTon,
          }));

        if (childItems.length > 0) {
          const { error: itemsError } = await supabase.from('truck_record_items').insert(childItems);
          if (itemsError) throw itemsError;
        }
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

  // ── Company CRUD (Save/Update & Delete) ────────────────────────────────────

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    if (companyData.id) {
      // EDIT existing company
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('companies')
          .update({
            code: companyData.code,
            name: companyData.name,
            description: companyData.description,
            logo_url: companyData.logo_url,
          })
          .eq('id', companyData.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Supabase RLS blocked updating the company. Please run supabase/fix_permissions.sql in Supabase SQL Editor.');
        }
      }

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyData.id ? ({ ...c, ...companyData } as Company) : c))
      );
      setSaveNotification(
        lang === 'km' ? '✅ បានកែប្រែក្រុមហ៊ុនជោគជ័យ!' : '✅ Company updated successfully!'
      );
      setTimeout(() => setSaveNotification(null), 3000);
    } else {
      // CREATE new company
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
  };

  // ── Product CRUD (Save/Update & Delete) ────────────────────────────────────

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (productData.id) {
      // EDIT existing product
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
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
          .eq('id', productData.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Supabase RLS blocked updating the product. Please run supabase/fix_permissions.sql in Supabase SQL Editor.');
        }
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p))
      );

      // Update current lineItems if this product is in the active list
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
      // CREATE new product
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
  };

  // ── Delete Product ────────────────────────────────────────────────────────

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find((p) => p.id === productId);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').delete().eq('id', productId).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Supabase RLS blocked deleting the product. Please run supabase/fix_permissions.sql in Supabase SQL Editor.');
      }
    }

    // If product had an uploaded image, clean it up from storage
    if (productToDelete?.image_url) {
      deleteImage(productToDelete.image_url);
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setLineItems((prev) => prev.filter((item) => item.productId !== productId));

    setSaveNotification(
      lang === 'km' ? '🗑️ បានលុបមុខទំនិញជោគជ័យ!' : '🗑️ Product deleted successfully!'
    );
    setTimeout(() => setSaveNotification(null), 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
            {/* Top Row: Company Selector (With Add/Edit Company) & Truck Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompanySelector
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
                onAddCompany={() => {
                  setEditingCompany(null);
                  setIsCompanyModalOpen(true);
                }}
                onEditCompany={(companyToEdit) => {
                  setEditingCompany(companyToEdit);
                  setIsCompanyModalOpen(true);
                }}
                lang={lang}
              />
              <TruckInfoForm
                plateNumber={plateNumber}
                setPlateNumber={setPlateNumber}
                recordDate={recordDate}
                setRecordDate={setRecordDate}
                operatorName={operatorName}
                setOperatorName={setOperatorName}
                lang={lang}
              />
            </div>

            {/* Middle: Line Items Table (With Add/Edit Product) */}
            <LineItemsTable
              items={lineItems}
              availableProducts={availableProducts}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onProductChange={handleProductChange}
              onQuantityChange={handleQuantityChange}
              onAddNewProduct={() => setIsProductManagementOpen(true)}
              onEditProduct={(productToEdit) => {
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
                onSave={handleInitiateSave}
                onReset={handleResetForm}
                isSaving={isSaving}
                lang={lang}
              />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <ReportTable records={records} companies={companies} lang={lang} />
        )}
      </main>

      {/* Modals for Company and Product Management */}
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

      {/* Review & Confirmation Popup Modal */}
      <SaveConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        plateNumber={plateNumber}
        company={selectedCompany}
        recordDate={recordDate}
        operatorName={operatorName}
        scaleInKg={scaleInKg}
        scaleOutKg={scaleOutKg}
        calculationResult={calculationResult}
        lineItems={lineItems}
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
