import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDefaultSheetEntry,
  type AssetEntry,
} from "~/composables/useBandJamCatalog";

type AssetType = "sheet" | "full_jam" | "level_jam" | "backing_track";

interface AssetFilters {
  asset_type: AssetType;
  style: string;
  difficulty?: string | null;
  instrument?: string | null;
}

interface UploadedStorageData {
  file_path: string;
  file_url: string;
  mime_type: string;
  label: string;
}

interface AssetMetadata extends AssetFilters, UploadedStorageData {
  id?: number;
  created_at?: string;
}

interface UploadAssetInput {
  file: File;
  assetType: AssetType;
  style: string;
  difficulty?: string | null;
  instrument?: string | null;
}

function slugify(value: string): string {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function safeFileName(name: string): string {
  const parts = String(name || "file").split(".");
  const extensionPart = parts.length > 1 ? parts.pop() : "";
  const extension = String(extensionPart || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const baseName = slugify(parts.join(".") || "file");
  return extension ? `${baseName}.${extension}` : baseName;
}

function buildStoragePath(
  assetType: AssetType,
  style: string,
  difficulty: string | null,
  instrument: string | null,
  fileName: string,
): string {
  const cleanStyle = slugify(style);
  const cleanDifficulty = difficulty ? slugify(difficulty) : null;
  const cleanInstrument = instrument ? slugify(instrument) : null;
  const cleanFileName = safeFileName(fileName);

  if (assetType === "sheet") {
    return `sheets/${cleanStyle}/${cleanDifficulty}/${cleanInstrument}/${cleanFileName}`;
  }
  if (assetType === "full_jam") {
    return `audio/full-jam/${cleanStyle}/${cleanFileName}`;
  }
  if (assetType === "level_jam") {
    return `audio/level-jam/${cleanStyle}/${cleanDifficulty}/${cleanFileName}`;
  }
  if (assetType === "backing_track") {
    return `audio/backing-track/${cleanStyle}/${cleanFileName}`;
  }

  return `uploads/${cleanStyle}/${cleanFileName}`;
}

export function useBandJamAssets() {
  const { $supabase } = useNuxtApp();
  const supabase = $supabase as SupabaseClient | null;
  const config = useRuntimeConfig();

  const supabaseBucket = config.public.supabaseBucket;
  const assetsTable = config.public.supabaseAssetsTable;

  const isSupabaseReady = computed<boolean>(() => {
    return Boolean(
      supabase && config.public.supabaseUrl && config.public.supabaseAnonKey,
    );
  });

  const applyAssetFilters = (
    query: any,
    { asset_type, style, difficulty = null, instrument = null }: AssetFilters,
  ) => {
    let filtered = query.eq("asset_type", asset_type).eq("style", style);
    filtered =
      difficulty === null
        ? filtered.is("difficulty", null)
        : filtered.eq("difficulty", difficulty);
    filtered =
      instrument === null
        ? filtered.is("instrument", null)
        : filtered.eq("instrument", instrument);
    return filtered;
  };

  const uploadFileToSupabase = async (
    file: File,
    filePath: string,
  ): Promise<UploadedStorageData> => {
    if (!isSupabaseReady.value || !supabase) {
      throw new Error("Supabase is not configured yet.");
    }

    const { error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(filePath);
    return {
      file_path: filePath,
      file_url: data.publicUrl,
      mime_type: file.type || "application/octet-stream",
      label: file.name,
    };
  };

  const findExistingAsset = async (
    asset: AssetFilters,
  ): Promise<{ id: number } | null> => {
    if (!isSupabaseReady.value || !supabase) {
      throw new Error("Supabase is not configured yet.");
    }

    const { data, error } = await applyAssetFilters(
      supabase.from(assetsTable).select("id").limit(1),
      asset,
    ).maybeSingle();

    if (error) throw error;
    return data as { id: number } | null;
  };

  const upsertAssetMetadata = async (
    asset: AssetMetadata,
  ): Promise<AssetMetadata> => {
    if (!supabase) {
      throw new Error("Supabase is not configured yet.");
    }

    const existing = await findExistingAsset(asset);

    if (existing) {
      const { data, error } = await supabase
        .from(assetsTable)
        .update(asset)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as AssetMetadata;
    }

    const { data, error } = await supabase
      .from(assetsTable)
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return data as AssetMetadata;
  };

  const getAssetByHierarchy = async (
    filters: AssetFilters,
  ): Promise<AssetEntry | null> => {
    if (!isSupabaseReady.value || !supabase) return null;

    const { data, error } = await applyAssetFilters(
      supabase.from(assetsTable).select("*"),
      filters,
    )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const record = data as AssetMetadata | null;
    if (!record) return null;

    return {
      name: record.label || "uploaded-file",
      type: record.mime_type || "application/octet-stream",
      data: record.file_url,
      filePath: record.file_path,
    };
  };

  const getSheetAsset = async (
    style: string,
    difficulty: string,
    instrument: string,
  ): Promise<AssetEntry | null> => {
    const uploaded = await getAssetByHierarchy({
      asset_type: "sheet",
      style,
      difficulty,
      instrument,
    });

    return uploaded || getDefaultSheetEntry(style, instrument, difficulty);
  };

  const getUploadedSheetAsset = async (
    style: string,
    difficulty: string,
    instrument: string,
  ): Promise<AssetEntry | null> => {
    return getAssetByHierarchy({
      asset_type: "sheet",
      style,
      difficulty,
      instrument,
    });
  };

  const getFullJamAsset = async (style: string): Promise<AssetEntry | null> => {
    return getAssetByHierarchy({
      asset_type: "full_jam",
      style,
      difficulty: null,
      instrument: null,
    });
  };

  const getLevelJamAsset = async (
    style: string,
    difficulty: string,
  ): Promise<AssetEntry | null> => {
    return getAssetByHierarchy({
      asset_type: "level_jam",
      style,
      difficulty,
      instrument: null,
    });
  };

  const getBackingTrackAsset = async (
    style: string,
  ): Promise<AssetEntry | null> => {
    return getAssetByHierarchy({
      asset_type: "backing_track",
      style,
      difficulty: null,
      instrument: null,
    });
  };

  const uploadAssetFile = async ({
    file,
    assetType,
    style,
    difficulty = null,
    instrument = null,
  }: UploadAssetInput): Promise<AssetMetadata> => {
    const filePath = buildStoragePath(
      assetType,
      style,
      difficulty,
      instrument,
      file.name,
    );
    const uploadResult = await uploadFileToSupabase(file, filePath);

    return upsertAssetMetadata({
      asset_type: assetType,
      style,
      difficulty,
      instrument,
      file_path: uploadResult.file_path,
      file_url: uploadResult.file_url,
      mime_type: uploadResult.mime_type,
      label: uploadResult.label,
    });
  };

  return {
    isSupabaseReady,
    getSheetAsset,
    getUploadedSheetAsset,
    getFullJamAsset,
    getLevelJamAsset,
    getBackingTrackAsset,
    uploadAssetFile,
  };
}
