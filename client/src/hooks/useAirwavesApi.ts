/**
 * TanStack Query hooks for Airwaves OS Manager API.
 *
 * These hooks provide reactive data fetching from the airwaves-manager.
 * When the API is unavailable (dev mode), components should fall back to mock data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  systemApi,
  containersApi,
  hardwareApi,
  networkApi,
  configApi,
  appsApi,
  type SystemInfo,
  type SystemStats,
  type ContainerInfo,
  type SdrDevice,
  type NetworkInterface,
  type AirwavesConfig,
  type CatalogApp,
} from '@/lib/api';

// ---------- System ----------

export function useSystemInfo() {
  return useQuery<SystemInfo>({
    queryKey: ['system', 'info'],
    queryFn: systemApi.getInfo,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSystemStats() {
  return useQuery<SystemStats>({
    queryKey: ['system', 'stats'],
    queryFn: systemApi.getStats,
    refetchInterval: 5_000,
    retry: 1,
  });
}

// ---------- Containers ----------

export function useContainers() {
  return useQuery<ContainerInfo[]>({
    queryKey: ['containers'],
    queryFn: containersApi.list,
    refetchInterval: 10_000,
    retry: 1,
  });
}

export function useContainerStart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => containersApi.start(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['containers'] }),
  });
}

export function useContainerStop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => containersApi.stop(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['containers'] }),
  });
}

export function useContainerRestart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => containersApi.restart(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['containers'] }),
  });
}

export function useContainerLogs(id: string, tail = 100) {
  return useQuery({
    queryKey: ['containers', id, 'logs', tail],
    queryFn: () => containersApi.logs(id, tail),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

// ---------- Hardware ----------

export function useSdrDevices() {
  return useQuery<SdrDevice[]>({
    queryKey: ['hardware', 'sdr'],
    queryFn: hardwareApi.listSdr,
    refetchInterval: 10_000,
    retry: 1,
  });
}

// ---------- Network ----------

export function useNetworkInterfaces() {
  return useQuery<NetworkInterface[]>({
    queryKey: ['network', 'interfaces'],
    queryFn: networkApi.listInterfaces,
    staleTime: 30_000,
    retry: 1,
  });
}

// ---------- Config ----------

export function useConfig() {
  return useQuery<AirwavesConfig>({
    queryKey: ['config'],
    queryFn: configApi.get,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: AirwavesConfig) => configApi.update(config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config'] }),
  });
}

// ---------- App Catalog ----------

export function useAppCatalog() {
  return useQuery<CatalogApp[]>({
    queryKey: ['apps', 'catalog'],
    queryFn: appsApi.catalog,
    staleTime: 300_000,
    retry: 1,
  });
}

export function useInstallApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => appsApi.install(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['apps', 'catalog'] });
    },
  });
}

export function useUninstallApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => appsApi.uninstall(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['apps', 'catalog'] });
    },
  });
}
