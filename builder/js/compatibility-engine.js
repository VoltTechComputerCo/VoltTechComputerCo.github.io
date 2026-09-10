export function getCompatibility(product, build) {
    const issues = [];
    const warnings = [];

    const cpu = build.cpu;
    const motherboard = build.motherboard;
    const memory = build.memory;
    const gpu = build.gpu;
    const psu = build.psu;
    const pcCase = build.case;
    const cooler = build.cooler;

    const candidateType = product.type;

    const selected = {
        cpu: candidateType === "cpu" ? product : cpu,
        motherboard: candidateType === "motherboard" ? product : motherboard,
        memory: candidateType === "memory" ? product : memory,
        gpu: candidateType === "gpu" ? product : gpu,
        psu: candidateType === "psu" ? product : psu,
        case: candidateType === "case" ? product : pcCase,
        cooler: candidateType === "cooler" ? product : cooler
    };

    checkCpuMotherboard(
        selected.cpu,
        selected.motherboard,
        issues
    );

    checkMemoryMotherboard(
        selected.memory,
        selected.motherboard,
        issues
    );

    checkMotherboardCase(
        selected.motherboard,
        selected.case,
        issues
    );

    checkGpuCase(
        selected.gpu,
        selected.case,
        issues
    );

    checkCoolerCpu(
        selected.cooler,
        selected.cpu,
        issues
    );

    checkCoolerCase(
        selected.cooler,
        selected.case,
        issues
    );

    checkCoolerCapacity(
        selected.cooler,
        selected.cpu,
        warnings
    );

    checkPsu(
        selected.psu,
        selected.gpu,
        selected,
        issues,
        warnings
    );

    return {
        compatible: issues.length === 0,
        issues,
        warnings
    };
}

export function validateBuild(build) {
    const issues = [];
    const warnings = [];

    checkCpuMotherboard(
        build.cpu,
        build.motherboard,
        issues
    );

    checkMemoryMotherboard(
        build.memory,
        build.motherboard,
        issues
    );

    checkMotherboardCase(
        build.motherboard,
        build.case,
        issues
    );

    checkGpuCase(
        build.gpu,
        build.case,
        issues
    );

    checkCoolerCpu(
        build.cooler,
        build.cpu,
        issues
    );

    checkCoolerCase(
        build.cooler,
        build.case,
        issues
    );

    checkCoolerCapacity(
        build.cooler,
        build.cpu,
        warnings
    );

    checkPsu(
        build.psu,
        build.gpu,
        build,
        issues,
        warnings
    );

    if (
        build.cpu &&
        build.cpu.specs?.coolerIncluded === false &&
        !build.cooler
    ) {
        warnings.push(
            "This CPU does not include a cooler. Add a compatible CPU cooler."
        );
    }

    return {
        compatible: issues.length === 0,
        issues,
        warnings
    };
}

export function estimatePower(build) {
    const componentPower =
        Object.values(build)
            .filter(Boolean)
            .reduce(
                (total, product) =>
                    total + Number(product.powerWatts || 0),
                0
            );

    /*
     * Base allowance covers board losses, RAM,
     * fans, USB devices and reasonable transient load.
     */
    const systemAllowance = 65;

    const estimated =
        componentPower > 0
            ? componentPower + systemAllowance
            : 0;

    const minimum =
        estimated > 0
            ? roundUp(estimated * 1.20, 50)
            : 0;

    const preferred =
        estimated > 0
            ? roundUp(estimated * 1.35, 50)
            : 0;

    return {
        estimated,
        minimum,
        preferred
    };
}

function checkCpuMotherboard(cpu, motherboard, issues) {
    if (!cpu || !motherboard) return;

    const cpuSocket =
        cpu.compatibility?.socket ||
        cpu.specs?.socket;

    const motherboardSocket =
        motherboard.compatibility?.socket ||
        motherboard.specs?.socket;

    if (
        cpuSocket &&
        motherboardSocket &&
        cpuSocket !== motherboardSocket
    ) {
        issues.push(
            `CPU socket ${cpuSocket} does not match motherboard socket ${motherboardSocket}.`
        );
    }
}

function checkMemoryMotherboard(
    memory,
    motherboard,
    issues
) {
    if (!memory || !motherboard) return;

    const memoryType =
        memory.compatibility?.memoryType ||
        memory.specs?.memoryType;

    const boardMemory =
        motherboard.compatibility?.memoryType ||
        motherboard.specs?.memoryType;

    if (
        memoryType &&
        boardMemory &&
        memoryType !== boardMemory
    ) {
        issues.push(
            `${memoryType} memory cannot be used with a ${boardMemory} motherboard.`
        );
    }

    const modules = Number(memory.specs?.modules || 0);
    const dimmSlots =
        Number(motherboard.specs?.dimmSlots || 0);

    if (
        modules &&
        dimmSlots &&
        modules > dimmSlots
    ) {
        issues.push(
            `This memory kit requires ${modules} DIMM slots, but the motherboard only has ${dimmSlots}.`
        );
    }
}

function checkMotherboardCase(
    motherboard,
    pcCase,
    issues
) {
    if (!motherboard || !pcCase) return;

    const formFactor =
        motherboard.compatibility?.formFactor ||
        motherboard.specs?.formFactor;

    const supported =
        pcCase.compatibility?.supportedMotherboardSizes ||
        pcCase.specs?.supportedMotherboardSizes ||
        [];

    if (
        formFactor &&
        supported.length &&
        !supported.includes(formFactor)
    ) {
        issues.push(
            `${formFactor} motherboard does not fit this case.`
        );
    }
}

function checkGpuCase(gpu, pcCase, issues) {
    if (!gpu || !pcCase) return;

    const gpuLength =
        Number(
            gpu.compatibility?.lengthMm ||
            gpu.specs?.lengthMm ||
            0
        );

    const maxLength =
        Number(
            pcCase.compatibility?.maxGpuLengthMm ||
            pcCase.specs?.maxGpuLengthMm ||
            0
        );

    if (
        gpuLength &&
        maxLength &&
        gpuLength > maxLength
    ) {
        issues.push(
            `GPU length is ${gpuLength} mm, but this case supports up to ${maxLength} mm.`
        );
    }
}

function checkCoolerCpu(
    cooler,
    cpu,
    issues
) {
    if (!cooler || !cpu) return;

    const cpuSocket =
        cpu.compatibility?.socket ||
        cpu.specs?.socket;

    const sockets =
        cooler.compatibility?.supportedSockets ||
        cooler.specs?.supportedSockets ||
        [];

    if (
        cpuSocket &&
        sockets.length &&
        !sockets.includes(cpuSocket)
    ) {
        issues.push(
            `This cooler does not support the CPU's ${cpuSocket} socket.`
        );
    }
}

function checkCoolerCase(
    cooler,
    pcCase,
    issues
) {
    if (!cooler || !pcCase) return;

    const coolerType =
        cooler.specs?.coolerType;

    if (coolerType === "air") {
        const height =
            Number(
                cooler.compatibility?.heightMm ||
                cooler.specs?.heightMm ||
                0
            );

        const maxHeight =
            Number(
                pcCase.compatibility?.maxCpuCoolerHeightMm ||
                pcCase.specs?.maxCpuCoolerHeightMm ||
                0
            );

        if (
            height &&
            maxHeight &&
            height > maxHeight
        ) {
            issues.push(
                `CPU cooler is ${height} mm tall, but this case supports up to ${maxHeight} mm.`
            );
        }
    }

    if (coolerType === "aio") {
        const radiator =
            Number(
                cooler.compatibility?.radiatorSizeMm ||
                cooler.specs?.radiatorSizeMm ||
                0
            );

        const supported =
            pcCase.compatibility?.radiatorSupportMm ||
            pcCase.specs?.radiatorSupportMm ||
            [];

        if (
            radiator &&
            supported.length &&
            !supported.includes(radiator)
        ) {
            issues.push(
                `${radiator} mm radiator is not listed as supported by this case.`
            );
        }
    }
}

function checkCoolerCapacity(
    cooler,
    cpu,
    warnings
) {
    if (!cooler || !cpu) return;

    const coolingCapacity =
        Number(
            cooler.compatibility?.recommendedCpuPowerWatts ||
            cooler.specs?.recommendedCpuPowerWatts ||
            0
        );

    const cpuPower =
        Number(cpu.powerWatts || 0);

    if (
        coolingCapacity &&
        cpuPower &&
        cpuPower > coolingCapacity
    ) {
        warnings.push(
            "The cooler may be marginal for this CPU under sustained heavy load."
        );
    }
}

function checkPsu(
    psu,
    gpu,
    build,
    issues,
    warnings
) {
    if (!psu) return;

    const psuWatts =
        Number(
            psu.compatibility?.wattage ||
            psu.specs?.wattage ||
            0
        );

    const power =
        estimatePower({
            ...build,
            psu: null
        });

    if (
        psuWatts &&
        power.minimum &&
        psuWatts < power.minimum
    ) {
        issues.push(
            `Estimated system load requires approximately ${power.minimum} W minimum, but the selected PSU is ${psuWatts} W.`
        );
    } else if (
        psuWatts &&
        power.preferred &&
        psuWatts < power.preferred
    ) {
        warnings.push(
            `The ${psuWatts} W PSU is usable by this estimate, but around ${power.preferred} W would provide better headroom.`
        );
    }

    if (!gpu) return;

    const gpuRecommendation =
        Number(
            gpu.compatibility?.recommendedPsuWatts ||
            gpu.specs?.recommendedPsuWatts ||
            0
        );

    if (
        gpuRecommendation &&
        psuWatts &&
        psuWatts < gpuRecommendation
    ) {
        warnings.push(
            `The GPU manufacturer-class recommendation is ${gpuRecommendation} W; the selected PSU is ${psuWatts} W.`
        );
    }

    const connector =
        gpu.specs?.powerConnector;

    const native12V2x6 =
        psu.compatibility?.has12V2x6 ??
        psu.specs?.has12V2x6;

    if (
        connector === "12V-2x6" &&
        native12V2x6 === false
    ) {
        warnings.push(
            "This GPU uses a 12V-2x6 power connection, while the PSU does not list a native 12V-2x6 cable."
        );
    }
}

function roundUp(value, step) {
    return Math.ceil(value / step) * step;
      }
