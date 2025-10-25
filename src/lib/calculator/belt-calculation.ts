import type { ConveyorBeltRequirement } from '../../types';

/**
 * Calculate required conveyor belts
 * Formula: Number of belts = ceil(items per second / belt speed)
 * @internal - Exported for testing
 */
export function calculateConveyorBelts(
  targetOutputRate: number,
  inputs: { itemId: number; itemName: string; requiredRate: number }[],
  beltSpeed: number
): ConveyorBeltRequirement {
  // Check for invalid belt speed
  if (!beltSpeed || beltSpeed <= 0) {
    return {
      inputs: 0,
      outputs: 0,
      total: 0,
      saturation: 0,
      bottleneckType: undefined,
    };
  }
  
  // Calculate output belts (for the main product)
  const outputBelts = Math.ceil(targetOutputRate / beltSpeed);
  
  // Calculate input belts (sum of all input items)
  const inputBelts = inputs.reduce((total, input) => {
    return total + Math.ceil(input.requiredRate / beltSpeed);
  }, 0);
  
  // Calculate saturation (how close we are to belt capacity)
  const outputSaturation = (targetOutputRate / (outputBelts * beltSpeed)) * 100;
  const inputSaturation = inputs.reduce((max, input) => {
    const beltsNeeded = Math.ceil(input.requiredRate / beltSpeed);
    const saturation = (input.requiredRate / (beltsNeeded * beltSpeed)) * 100;
    return Math.max(max, saturation);
  }, 0);
  
  const maxSaturation = Math.max(outputSaturation, inputSaturation);
  const bottleneckType = outputSaturation > inputSaturation ? 'output' : 'input';
  
  return {
    inputs: inputBelts,
    outputs: outputBelts,
    total: inputBelts + outputBelts,
    saturation: maxSaturation,
    bottleneckType,
  };
}

