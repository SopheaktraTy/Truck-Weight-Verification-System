import React, { useState, useEffect, useMemo } from 'react';
import { Company, Product, LineItemState, TruckRecord } from './types';
import { INITIAL_COMPANIES, INITIAL_PRODUCTS, INITIAL_RECORDS } from './lib/mockData';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { verifyTruckWeight, VerificationResult } from './lib/calculator';

import { Header } from './components/Header';
import { MasterDataManagement } from './components/MasterDataManagement';
import { CompanySelector } from './components/CompanySelector';
import { TruckInfoForm } from './components/TruckInfoForm';
import { LineItemsTable } from './components/LineItemsTable';
import { ScaleEntryCard } from './components/ScaleEntryCard';
import { VerificationBadge } from './components/VerificationBadge';
import { ReportTable } from './components/ReportTable';

export function App() {
  const [activeTab, setActiveTab] = useState<'entry' | 'report' | 'master'>('entry');
  const [lang, setLang] = useState<'km' | 'en'>('km');

  // Master Data
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [records, setRecords] = useState<TruckRecord[]>(INITIAL_RECORDS);

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[1]?.id || '');
  const [plateNumber, setPlateNumber] = useState<string>('3G-2487');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [operatorName, setOperatorName] = useState<string>('Sopheaktra');
  const [scaleInKg, setScaleInKg] = useState<number>(12500);
  const [scaleOutKg, setScaleOutKg] = useState<number>(29630);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Filter products for the chosen company
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.company_id === selectedCompanyId);
  }, [products, selectedCompanyId]);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);

  // Initialize or reset line items whenever company changes
  useEffect(() => {
    if (availableProducts.length > 0) {
      const initialItems: LineItemState[] = availableProducts.map((p, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: p.id,
        productNameKh: p.name_kh,
        productNameEn: p.name_en,
        packagingSpec: p.packaging_spec,
        unit: p.unit,
        unitWeightKg: p.unit_weight_kg,
        imageUrl: p.image_url,
        quantity: 0,
        totalWeightKg: 0,
        totalWeightTon: 0,
      }));
      setLineItems(initialItems);
    }
  }, [selectedCompanyId, availableProducts]);

  // Fetch initial data from Supabase if configured
  useEffect(() => {
    async function loadFromSupabase() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: dbCompanies } = await supabase.from('companies').select('*');
        if (dbCompanies && dbCompanies.length > 0) {
          setCompanies(dbCompanies);
          setSelectedCompanyId(dbCompanies[0].id);
        }

        const { data: dbProducts } = await supabase.from('products').select('*').order('display_order');
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
        }

        const { data: dbRecords } = await supabase
          .from('truck_records')
          .select('*, companies(code)')
          .order('created_at', { ascending: false });

        if (dbRecords && dbRecords.length > 0) {
          const mapped: TruckRecord[] = dbRecords.map((r: any) => ({
            ...r,
            company_code: r.companies?.code,
          }));
          setRecords(mapped);
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      }
    }

    loadFromSupabase();
  }, []);

  // Handle adding an empty item row
  const handleAddItem = () => {
    const firstProd = availableProducts[0];
    const newItem: LineItemState = {
      id: `item-${Date.now()}`,
      productId: firstProd?.id || '',
      productNameKh: firstProd?.name_kh || '',
      productNameEn: firstProd?.name_en || '',
      packagingSpec: firstProd?.packaging_spec || '',
      unit: firstProd?.unit || 'កេស',
      unitWeightKg: firstProd?.unit_weight_kg || 0,
      imageUrl: firstProd?.image_url,
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
    if (!product) return;

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
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: 0,
        totalWeightKg: 0,
        totalWeightTon: 0,
      }))
    );
  };

  // Handle Save Record
  const handleSaveRecord = async () => {
    if (!plateNumber.trim()) {
      alert(lang === 'km' ? 'សូមបញ្ចូលផ្លាកលេខឡានជាមុនសិន!' : 'Please enter truck plate number!');
      return;
    }

    if (calculationResult.scaleNetKg <= 0 && calculationResult.warehouseTotalKg <= 0) {
      alert(lang === 'km' ? 'សូមបញ្ចូលទម្ងន់ជញ្ជីង ឬចំនួនទំនិញ!' : 'Please enter scale weights or item quantities!');
      return;
    }

    setIsSaving(true);
    const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

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

        newRecord.id = recordData.id;
      }

      setRecords((prev) => [newRecord, ...prev]);

      setSaveNotification(
        lang === 'km'
          ? `✅ បានរក្សាទុកជោគជ័យ! រថយន្តលេខ ${newRecord.plate_number} (${newRecord.status})`
          : `✅ Successfully saved truck record ${newRecord.plate_number} (${newRecord.status})`
      );

      setTimeout(() => setSaveNotification(null), 4000);
      handleResetForm();
    } catch (err: any) {
      console.error('Error saving record:', err);
      alert('Failed to save to Supabase: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Master Data Callbacks ─────────────────────────────────────────────────

  const handleAddCompany = async (company: Partial<Company>) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          code: company.code,
          name: company.name,
          description: company.description,
          logo_url: company.logo_url,
        })
        .select()
        .single();
      if (error) throw error;
      setCompanies((prev) => [...prev, data]);
      setSelectedCompanyId(data.id);
    } else {
      const newCompany: Company = {
        id: `c-${Date.now()}`,
        code: company.code ?? '',
        name: company.name ?? '',
        description: company.description,
        logo_url: company.logo_url,
      };
      setCompanies((prev) => [...prev, newCompany]);
      setSelectedCompanyId(newCompany.id);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('products').delete().eq('company_id', id);
    }
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) => prev.filter((p) => p.company_id !== id));
    if (selectedCompanyId === id) {
      const first = companies.find((c) => c.id !== id);
      setSelectedCompanyId(first?.id || '');
    }
  };

  const handleAddProduct = async (product: Partial<Product>) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          company_id: product.company_id,
          name_kh: product.name_kh,
          name_en: product.name_en,
          packaging_spec: product.packaging_spec,
          unit: product.unit,
          unit_weight_kg: product.unit_weight_kg,
          image_url: product.image_url,
          display_order: product.display_order ?? 10,
        })
        .select()
        .single();
      if (error) throw error;
      setProducts((prev) => [...prev, data]);
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        company_id: product.company_id!,
        name_kh: product.name_kh ?? '',
        name_en: product.name_en ?? '',
        packaging_spec: product.packaging_spec ?? '',
        unit: product.unit ?? '',
        unit_weight_kg: product.unit_weight_kg ?? 0,
        image_url: product.image_url,
        display_order: product.display_order ?? 10,
      };
      setProducts((prev) => [...prev, newProduct]);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
      />

      {/* Save Notification Banner */}
      {saveNotification && (
        <div className="bg-emerald-600 text-white text-center py-2.5 px-4 font-bold text-sm shadow-md animate-bounce">
          {saveNotification}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'entry' && (
          <div className="space-y-6">
            {/* Top Row: Company Picker & Truck Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompanySelector
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
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

            {/* Middle: Line Items Table */}
            <LineItemsTable
              items={lineItems}
              availableProducts={availableProducts}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onProductChange={handleProductChange}
              onQuantityChange={handleQuantityChange}
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
                onSave={handleSaveRecord}
                onReset={handleResetForm}
                isSaving={isSaving}
                lang={lang}
              />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <ReportTable records={records} lang={lang} />
        )}

        {activeTab === 'master' && (
          <MasterDataManagement
            companies={companies}
            products={products}
            onAddCompany={handleAddCompany}
            onDeleteCompany={handleDeleteCompany}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            lang={lang}
          />
        )}
      </main>

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
