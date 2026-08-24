import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { HeaderScreen } from '@/components/ui/header-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { File, Paths } from 'expo-file-system';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import type { StatementFormat } from '@/types/account.types';
import { downloadToAndroidDownloads } from '@/utils/download';
import { formatDateShort } from '@/utils/format';
import { shareFile } from '@/utils/receipt';
import { BackButton } from '@/components/ui/back-button';

interface FileTypeOption {
  label: string;
  value: StatementFormat;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const FILE_TYPE_OPTIONS: FileTypeOption[] = [
  { label: 'Excel', value: 'xlsx', icon: 'file-excel-box' },
  { label: 'PDF', value: 'pdf', icon: 'file-pdf-box' },
];

/**
 * Snapshot of what a job was actually requested with. The form stays editable
 * after a job completes, so the result card and the download read from here —
 * not from live state — or they describe a file the server never built. Dates
 * are null on deep-link entry, where only the job id and format are known.
 */
interface StatementJobMeta {
  format: StatementFormat | null;
  startDate: Date | null;
  endDate: Date | null;
}

function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
  );
}

function endOfDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

export default function StatementScreen() {
  const params = useLocalSearchParams<{
    jobId?: string | string[];
    format?: string | string[];
  }>();
  const initialJobId =
    typeof params.jobId === 'string' && params.jobId ? params.jobId : null;
  const initialFormat: StatementFormat | null =
    params.format === 'pdf' || params.format === 'xlsx' ? params.format : null;

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [format, setFormat] = useState<StatementFormat | null>(initialFormat);
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [jobMeta, setJobMeta] = useState<StatementJobMeta | null>(
    initialJobId
      ? { format: initialFormat, startDate: null, endDate: null }
      : null,
  );

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [fileTypeModal, setFileTypeModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      accountService.requestStatement({
        format: format!,
        date_from: startOfDay(startDate!).toISOString(),
        date_to: endOfDay(endDate!).toISOString(),
      }),
    onSuccess: (res) => setJobId(res.job_id),
  });

  const jobQuery = useQuery({
    queryKey: [QUERY_KEYS.STATEMENT_JOB, jobId],
    queryFn: () => accountService.getStatementJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      const s = query.state.data?.job_status;
      if (s === 'ready' || s === 'failed') return false;
      return 3000;
    },
  });

  const jobStatus = jobQuery.data?.job_status;
  const downloadUrl = jobQuery.data?.download_url;
  const isProcessing =
    !!jobId &&
    !jobQuery.isError &&
    (jobStatus === 'pending' || jobStatus === 'processing' || !jobStatus);

  const selectedFileType = FILE_TYPE_OPTIONS.find((o) => o.value === format);
  const jobFileType = FILE_TYPE_OPTIONS.find(
    (o) => o.value === jobMeta?.format,
  );
  const rangeInvalid =
    !!startDate && !!endDate && startDate.getTime() > endDate.getTime();
  const canGenerate =
    !!startDate &&
    !!endDate &&
    !!format &&
    !rangeInvalid &&
    !generateMutation.isPending &&
    !isProcessing;

  const activeError =
    (generateMutation.error as any) ||
    (jobQuery.isError ? (jobQuery.error as any) : null);
  const errorMsg = activeError
    ? activeError?.response?.data?.error ||
      activeError?.message ||
      'Something went wrong. Please try again.'
    : '';

  const handleStartChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowStartPicker(false);
    if (event.type === 'set' && selected) {
      setStartDate(selected);
    }
  };

  const handleEndChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowEndPicker(false);
    if (event.type === 'set' && selected) {
      setEndDate(selected);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    setJobId(null);
    setJobMeta({ format, startDate, endDate });
    generateMutation.reset();
    generateMutation.mutate();
  };

  const handleDownload = async () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);
    try {
      // Must be the format the job was built with, not the live picker — the
      // user can change the picker after a job completes, and mislabelling the
      // bytes produces a file the OS refuses to open. On deep-link entry the
      // format is unknown, so fall back to xlsx (it opens regardless of ext).
      const jobFormat = jobMeta?.format;
      const extension = jobFormat === 'pdf' ? 'pdf' : 'xlsx';
      const mime =
        jobFormat === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const filename = `neat-statement-${Date.now()}.${extension}`;

      if (Platform.OS === 'android') {
        await downloadToAndroidDownloads(
          downloadUrl,
          filename,
          mime,
          'Your Neat account statement',
        );
      } else {
        const destination = new File(Paths.cache, filename);
        const downloaded = await File.downloadFileAsync(downloadUrl, destination);
        await shareFile(downloaded.uri);
      }
    } catch {
      Alert.alert(
        'Download failed',
        'We could not download your statement. Please try again.',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <HeaderScreen padded={false}>
      <View className="flex-1 px-6">
        <View className="flex-row items-center gap-2 mt-4 mb-8">
          <BackButton className="" />
          <Text
            className="text-[20px] font-medium text-[#1A1A1A] leading-[24px]"
            style={{ includeFontPadding: false }}
          >
            Account Statement
          </Text>
        </View>

        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Start Date */}
          <View className="mb-5">
            <Text className="text-[13px] font-semibold text-[#374151] mb-2">
              Start Date
            </Text>
            <TouchableOpacity
              className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center justify-between"
              onPress={() => setShowStartPicker(true)}
            >
              <Text
                className={`text-[15px] ${
                  startDate ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                }`}
              >
                {startDate ? formatDateShort(startDate) : 'Select start date'}
              </Text>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View className="mb-5">
            <Text className="text-[13px] font-semibold text-[#374151] mb-2">
              End Date
            </Text>
            <TouchableOpacity
              className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center justify-between"
              onPress={() => setShowEndPicker(true)}
            >
              <Text
                className={`text-[15px] ${
                  endDate ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                }`}
              >
                {endDate ? formatDateShort(endDate) : 'Select end date'}
              </Text>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {rangeInvalid && (
              <Text className="text-xs text-red-500 mt-1.5">
                End date must be on or after start date
              </Text>
            )}
          </View>

          {/* File Type */}
          <View className="mb-5 mt-2">
            <Text className="text-base font-bold text-[#1A1A1A] mb-1">
              File Type
            </Text>
            <Text className="text-[13px] text-[#6B7280] leading-5 mb-3">
              Select the format in which you would like to receive your account
              statement
            </Text>
            <TouchableOpacity
              className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center justify-between"
              onPress={() => setFileTypeModal(true)}
            >
              <Text
                className={`text-[15px] ${
                  selectedFileType ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                }`}
              >
                {selectedFileType?.label ?? 'Select file type'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Inline result section */}
          {jobId && (
            <View className="mt-6">
              {isProcessing && (
                <View className="bg-[#E8EEF7] rounded-xl px-5 py-5 flex-row items-center">
                  <ActivityIndicator size="small" color="#032252" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-[#1A1A1A]">
                      Generating your statement...
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-0.5">
                      This usually takes a few seconds.
                    </Text>
                  </View>
                </View>
              )}

              {jobStatus === 'ready' && downloadUrl && (
                <View className="bg-[#E8EEF7] rounded-xl px-5 py-5">
                  <View className="flex-row items-center mb-4">
                    <View className="w-11 h-11 rounded-full bg-white items-center justify-center">
                      <MaterialCommunityIcons
                        name={
                          (jobFileType?.icon ?? 'file-document-outline') as any
                        }
                        size={24}
                        color="#032252"
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A1A]">
                        Statement Ready
                      </Text>
                      {jobMeta?.startDate && jobMeta.endDate && (
                        <Text className="text-xs text-[#6B7280] mt-0.5">
                          {formatDateShort(jobMeta.startDate)} –{' '}
                          {formatDateShort(jobMeta.endDate)}
                          {jobFileType ? ` • ${jobFileType.label}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-[#F9B700] rounded-full py-3 items-center flex-row justify-center"
                    onPress={handleDownload}
                    disabled={downloading}
                    activeOpacity={0.85}
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="#032252" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="download"
                          size={18}
                          color="#032252"
                        />
                        <Text className="text-[#032252] text-sm font-semibold ml-2">
                          Download
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {jobStatus === 'failed' && (
                <View className="bg-[#FEF2F2] rounded-xl px-5 py-5">
                  <View className="flex-row items-center mb-4">
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={24}
                      color="#EF4444"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A1A]">
                        Statement generation failed
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-0.5">
                        Please try again.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-[#F9B700] rounded-full py-3 items-center"
                    onPress={handleGenerate}
                    activeOpacity={0.85}
                  >
                    <Text className="text-[#032252] text-sm font-semibold">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </KeyboardAwareScrollView>

        {/* Generate button */}
        <View className="pb-4">
          {errorMsg !== '' && (
            <Text className="text-xs text-red-500 text-center mb-2">
              {errorMsg}
            </Text>
          )}
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${
              canGenerate || generateMutation.isPending
                ? 'bg-[#F9B700]'
                : 'bg-[#E5E7EB]'
            }`}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
          >
            {generateMutation.isPending ? (
              <ActivityIndicator size="small" color="#032252" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  canGenerate ? 'text-[#032252]' : 'text-[#9CA3AF]'
                }`}
              >
                Generate Statement
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Native date pickers. iOS needs an explicit Done button since the native
          component does not auto-dismiss — wrap it in a bottom-sheet Modal. */}
      {showStartPicker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={startDate ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={handleStartChange}
        />
      )}
      {showEndPicker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={endDate ?? new Date()}
          mode="date"
          minimumDate={startDate ?? undefined}
          maximumDate={new Date()}
          onChange={handleEndChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={showStartPicker || showEndPicker}
          onRequestClose={() => {
            setShowStartPicker(false);
            setShowEndPicker(false);
          }}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl pb-16">
              <View className="flex-row justify-end px-5 py-3 border-b border-[#F3F4F6]">
                <TouchableOpacity
                  onPress={() => {
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }}
                >
                  <Text className="text-base font-semibold text-[#032252]">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate ?? new Date()}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  onChange={handleStartChange}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDate ?? new Date()}
                  mode="date"
                  display="inline"
                  minimumDate={startDate ?? undefined}
                  maximumDate={new Date()}
                  onChange={handleEndChange}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* File type modal */}
      <Modal visible={fileTypeModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-16">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-[#1A1A1A]">
                Select File Type
              </Text>
              <TouchableOpacity onPress={() => setFileTypeModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {FILE_TYPE_OPTIONS.map((option) => {
              const isSelected = format === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  className={`flex-row items-center rounded-xl border-[1.5px] px-4 py-3.5 mb-3 ${
                    isSelected
                      ? 'border-[#032252] bg-[#E8EEF7]'
                      : 'border-[#E5E7EB] bg-white'
                  }`}
                  onPress={() => {
                    setFormat(option.value);
                    setFileTypeModal(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isSelected ? 'bg-white' : 'bg-[#F5F5F5]'
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={22}
                      color="#032252"
                    />
                  </View>
                  <Text
                    className={`text-[15px] ml-3 flex-1 ${
                      isSelected
                        ? 'font-semibold text-[#032252]'
                        : 'text-[#374151]'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#032252"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </HeaderScreen>
  );
}
