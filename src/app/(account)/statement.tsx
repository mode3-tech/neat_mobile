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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

interface FileTypeOption {
  label: string;
  value: StatementFormat;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const FILE_TYPE_OPTIONS: FileTypeOption[] = [
  { label: 'Excel', value: 'csv', icon: 'file-excel-box' },
  { label: 'PDF', value: 'pdf', icon: 'file-pdf-box' },
];

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
    params.format === 'pdf' || params.format === 'csv' ? params.format : null;

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [format, setFormat] = useState<StatementFormat | null>(initialFormat);
  const [jobId, setJobId] = useState<string | null>(initialJobId);

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
    generateMutation.reset();
    generateMutation.mutate();
  };

  const handleDownload = async () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);
    try {
      // On deep-link entry, `format` is unknown — fall back to csv so the file
      // still has a reasonable extension (it opens regardless of ext).
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-6 py-1.5 mt-2 mb-12"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        <Text className="text-[20px] font-medium text-[#1A1A1A] mb-8">
          Account Statement
        </Text>

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
                <View className="bg-[#EEF0FF] rounded-xl px-5 py-5 flex-row items-center">
                  <ActivityIndicator size="small" color="#472FF8" />
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
                <View className="bg-[#EEF0FF] rounded-xl px-5 py-5">
                  <View className="flex-row items-center mb-4">
                    <View className="w-11 h-11 rounded-full bg-white items-center justify-center">
                      <MaterialCommunityIcons
                        name={
                          (selectedFileType?.icon ?? 'file-document-outline') as any
                        }
                        size={24}
                        color="#472FF8"
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-semibold text-[#1A1A1A]">
                        Statement Ready
                      </Text>
                      {startDate && endDate && (
                        <Text className="text-xs text-[#6B7280] mt-0.5">
                          {formatDateShort(startDate)} – {formatDateShort(endDate)}
                          {selectedFileType ? ` • ${selectedFileType.label}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-[#472FF8] rounded-full py-3 items-center flex-row justify-center"
                    onPress={handleDownload}
                    disabled={downloading}
                    activeOpacity={0.85}
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="download"
                          size={18}
                          color="#fff"
                        />
                        <Text className="text-white text-sm font-semibold ml-2">
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
                    className="bg-[#472FF8] rounded-full py-3 items-center"
                    onPress={handleGenerate}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white text-sm font-semibold">
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
                ? 'bg-[#472FF8]'
                : 'bg-[#E5E7EB]'
            }`}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
          >
            {generateMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  canGenerate ? 'text-white' : 'text-[#9CA3AF]'
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
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-16">
              <View className="flex-row justify-end px-5 py-3 border-b border-[#F3F4F6]">
                <TouchableOpacity
                  onPress={() => {
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }}
                >
                  <Text className="text-base font-semibold text-[#472FF8]">
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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-4 pb-16">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-bold text-[#1A1A1A]">
                Select File Type
              </Text>
              <TouchableOpacity onPress={() => setFileTypeModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {FILE_TYPE_OPTIONS.map((option) => {
              const isSelected = format === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  className={`px-6 py-4 border-b border-[#F3F4F6] flex-row items-center ${
                    isSelected ? 'bg-[#EEF0FF]' : ''
                  }`}
                  onPress={() => {
                    setFormat(option.value);
                    setFileTypeModal(false);
                  }}
                >
                  <View className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center">
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={22}
                      color="#472FF8"
                    />
                  </View>
                  <Text className="text-[15px] text-[#1A1A1A] ml-3 flex-1">
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#472FF8"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
