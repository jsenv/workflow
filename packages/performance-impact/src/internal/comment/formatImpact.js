import { formatMetricValue } from "../formatMetricValue.js";
import { formatRatioAsPercentage } from "../formatRatio.js";

export const formatImpact = ({
  metricValueBeforeMerge,
  metricValueAfterMerge,
  metricUnit,
}) => {
  const diff = metricValueAfterMerge - metricValueBeforeMerge;

  if (diff === 0) {
    return ``;
  }

  const diffFormatted = `${diff < 0 ? "-" : "+"}${formatMetricValue({
    value: Math.abs(diff),
    unit: metricUnit,
  })}`;

  return diffFormatted;
};

export const formatImpactAsPercentage = ({
  metricValueBeforeMerge,
  metricValueAfterMerge,
}) => {
  const diff = metricValueAfterMerge - metricValueBeforeMerge;
  const diffRatio =
    metricValueBeforeMerge === 0
      ? 1
      : metricValueAfterMerge === 0
        ? -1
        : diff / metricValueBeforeMerge;
  return formatRatioAsPercentage(diffRatio);
};
