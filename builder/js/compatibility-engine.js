export function getCompatibility(product, build) {
    const issues = [];
    const warnings = [];

    const selected = {
        cpu: product.type === "cpu" ? product : build.cpu,
        motherboard: product.type === "motherboard" ? product : build.motherboard,
        memory: product.type === "memory" ? product : build.memory,
        gpu: product.type === "gpu" ? product : build.gpu,
        storage: product.type === "storage" ? product : build.storage,
        psu: product.type === "psu" ? product : build.psu,
        case: product.type === "case" ? product : build.case,
        cooler: product.type === "cooler" ? product : build.cooler
    };

    runChecks(selected, issues, warnings);

    return {
        compatible: issues.length === 0,
        issues,
        warnings
    };
}

export function validateBuild(build) {
    const issues = [];
    const warnings = [];

    runChecks(build, issues, warnings);

    if (build.cpu && build.cpu.specs?.coolerIncluded === false && !build.cooler) {
        warnings.push(
            makeDiagnostic(
                "This CPU does not include a cooler. Add a compatible CPU cooler.",
                "cooler"
            )
        );
    }

    return {
        compatible: issues.length === 0,
        issues,
        warnings
    };
}

export function estimatePower(build) {
    const componentPower = Object.values(build)
        .filter(Boolean)
        .reduce((total, product) => total + Number(product.powerWatts || 0), 0);

    const systemAllowance = 65;
    const estimated = componentPower > 0 ? componentPower + systemAllowance : 0;
    const minimum = estimated > 0 ? roundUp(estimated * 1.20, 50) : 0;
    const preferred = estimated > 0 ? roundUp(estimated * 1.35, 50) : 0;

    return { estimated, minimum, preferred };
}

function runChecks(build, issues, warnings) {
    checkCpuMotherboard(build.cpu, build.motherboard, issues, warnings);
    checkMemoryMotherboard(build.memory, build.motherboard, issues);
    checkStorageMotherboard(build.storage, build.motherboard, issues, warnings);
    checkMotherboardCase(build.motherboard, build.case, issues);
    checkGpuCase(build.gpu, build.case, issues);
    checkCoolerCpu(build.cooler, build.cpu, issues);
    checkCoolerCase(build.cooler, build.case, issues);
    checkCoolerCapacity(build.cooler, build.cpu, warnings);
    checkPsu(build.psu, build.gpu, build, issues, warnings);
}

function makeDiagnostic(text, category, alternateCategory = null) {
    return { text, category, alternateCategory };
}

function checkCpuMotherboard(cpu, motherboard, issues, warnings) {
    if (!cpu || !motherboard) return;

    const cpuSocket = cpu.compatibility?.socket || cpu.specs?.socket;
    const boardSocket = motherboard.compatibility?.socket || motherboard.specs?.socket;

    if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
        issues.push(
            makeDiagnostic(
                `CPU socket ${cpuSocket} does not match motherboard socket ${boardSocket}.`,
                "motherboard",
                "cpu"
            )
        );
        return;
    }

    const chipset = motherboard.compatibility?.chipset || motherboard.specs?.chipset;
    const supportedChipsets = cpu.compatibility?.supportedChipsets || [];

    if (chipset && supportedChipsets.length && !supportedChipsets.includes(chipset)) {
        issues.push(
            makeDiagnostic(
                `${cpu.compatibility?.cpuFamily || "This CPU"} is not listed as supported by the motherboard's ${chipset} chipset in the current compatibility data.`,
                "motherboard",
                "cpu"
            )
        );
        return;
    }

    const biosList = cpu.compatibility?.biosMayRequireUpdateChipsets || [];

    if (chipset && biosList.includes(chipset)) {
        const flashback = motherboard.specs?.biosFlashback === true;

        warnings.push(
            makeDiagnostic(
                flashback
                    ? `This CPU and ${chipset} motherboard may require a BIOS update. This board lists BIOS Flashback, which can make updating easier.`
                    : `This CPU and ${chipset} motherboard may require a BIOS update before the CPU will boot. Verify the board's shipped BIOS version before assembly.`,
                "motherboard",
                "cpu"
            )
        );
    }
}

function checkMemoryMotherboard(memory, motherboard, issues) {
    if (!memory || !motherboard) return;

    const memoryType = memory.compatibility?.memoryType || memory.specs?.memoryType;
    const boardMemory = motherboard.compatibility?.memoryType || motherboard.specs?.memoryType;

    if (memoryType && boardMemory && memoryType !== boardMemory) {
        issues.push(
            makeDiagnostic(
                `${memoryType} memory cannot be used with a ${boardMemory} motherboard.`,
                "memory",
                "motherboard"
            )
        );
    }

    const modules = Number(memory.compatibility?.modules ?? memory.specs?.modules ?? 0);
    const dimmSlots = Number(motherboard.specs?.dimmSlots || 0);

    if (modules && dimmSlots && modules > dimmSlots) {
        issues.push(
            makeDiagnostic(
                `This memory kit requires ${modules} DIMM slots, but the motherboard only has ${dimmSlots}.`,
                "memory",
                "motherboard"
            )
        );
    }

    const capacityGB = Number(memory.compatibility?.capacityGB ?? memory.specs?.capacityGB ?? 0);
    const maxMemoryGB = Number(
        motherboard.compatibility?.maxMemoryGB ??
        motherboard.specs?.maxMemoryGB ??
        0
    );

    if (capacityGB && maxMemoryGB && capacityGB > maxMemoryGB) {
        issues.push(
            makeDiagnostic(
                `This memory kit is ${capacityGB} GB, but the motherboard is listed for up to ${maxMemoryGB} GB.`,
                "memory",
                "motherboard"
            )
        );
    }
}

function checkStorageMotherboard(storage, motherboard, issues, warnings) {
    if (!storage || !motherboard) return;

    const interfaceType = storage.compatibility?.interface || storage.specs?.interface;
    const m2Slots = Number(
        motherboard.compatibility?.m2Slots ??
        motherboard.specs?.m2Slots ??
        0
    );
    const sataPorts = Number(
        motherboard.compatibility?.sataPorts ??
        motherboard.specs?.sataPorts ??
        0
    );

    if (
        interfaceType === "NVMe" &&
        motherboard.specs?.m2Slots !== undefined &&
        m2Slots < 1
    ) {
        issues.push(
            makeDiagnostic(
                "This NVMe drive requires an M.2 slot, but the motherboard does not list one.",
                "storage",
                "motherboard"
            )
        );
    }

    if (
        interfaceType === "SATA" &&
        motherboard.specs?.sataPorts !== undefined &&
        sataPorts < 1
    ) {
        issues.push(
            makeDiagnostic(
                "This SATA drive requires a SATA port, but the motherboard does not list one.",
                "storage",
                "motherboard"
            )
        );
    }

    if (interfaceType !== "NVMe") return;

    const driveGen = Number(
        storage.compatibility?.pcieGeneration ??
        storage.specs?.pcieGeneration ??
        0
    );
    const boardGen = Number(motherboard.compatibility?.maxM2PcieGeneration || 0);

    if (driveGen && boardGen && driveGen > boardGen) {
        warnings.push(
            makeDiagnostic(
                `This PCIe ${driveGen}.0 NVMe drive can be installed, but the motherboard's current M.2 compatibility data tops out at PCIe ${boardGen}.0, so the drive may run below its maximum interface speed.`,
                "motherboard",
                "storage"
            )
        );
    }
}

function checkMotherboardCase(motherboard, pcCase, issues) {
    if (!motherboard || !pcCase) return;

    const formFactor = motherboard.compatibility?.formFactor || motherboard.specs?.formFactor;
    const supported =
        pcCase.compatibility?.supportedMotherboardSizes ||
        pcCase.specs?.supportedMotherboardSizes ||
        [];

    if (formFactor && supported.length && !supported.includes(formFactor)) {
        issues.push(
            makeDiagnostic(
                `${formFactor} motherboard does not fit this case.`,
                "case",
                "motherboard"
            )
        );
    }
}

function checkGpuCase(gpu, pcCase, issues) {
    if (!gpu || !pcCase) return;

    const gpuLength = Number(gpu.compatibility?.lengthMm || gpu.specs?.lengthMm || 0);
    const maxLength = Number(
        pcCase.compatibility?.maxGpuLengthMm ||
        pcCase.specs?.maxGpuLengthMm ||
        0
    );

    if (gpuLength && maxLength && gpuLength > maxLength) {
        issues.push(
            makeDiagnostic(
                `GPU length is ${gpuLength} mm, but this case supports up to ${maxLength} mm.`,
                "case",
                "gpu"
            )
        );
    }
}

function checkCoolerCpu(cooler, cpu, issues) {
    if (!cooler || !cpu) return;

    const cpuSocket = cpu.compatibility?.socket || cpu.specs?.socket;
    const sockets =
        cooler.compatibility?.supportedSockets ||
        cooler.specs?.supportedSockets ||
        [];

    if (cpuSocket && sockets.length && !sockets.includes(cpuSocket)) {
        issues.push(
            makeDiagnostic(
                `This cooler does not support the CPU's ${cpuSocket} socket.`,
                "cooler",
                "cpu"
            )
        );
    }
}

function checkCoolerCase(cooler, pcCase, issues) {
    if (!cooler || !pcCase) return;

    const coolerType = cooler.specs?.coolerType;

    if (coolerType === "air") {
        const height = Number(
            cooler.compatibility?.heightMm ||
            cooler.specs?.heightMm ||
            0
        );
        const maxHeight = Number(
            pcCase.compatibility?.maxCpuCoolerHeightMm ||
            pcCase.specs?.maxCpuCoolerHeightMm ||
            0
        );

        if (height && maxHeight && height > maxHeight) {
            issues.push(
                makeDiagnostic(
                    `CPU cooler is ${height} mm tall, but this case supports up to ${maxHeight} mm.`,
                    "cooler",
                    "case"
                )
            );
        }
    }

    if (coolerType === "aio") {
        const radiator = Number(
            cooler.compatibility?.radiatorSizeMm ||
            cooler.specs?.radiatorSizeMm ||
            0
        );
        const supported =
            pcCase.compatibility?.radiatorSupportMm ||
            pcCase.specs?.radiatorSupportMm ||
            [];

        if (radiator && supported.length && !supported.includes(radiator)) {
            issues.push(
                makeDiagnostic(
                    `${radiator} mm radiator is not listed as supported by this case.`,
                    "cooler",
                    "case"
                )
            );
        }
    }
}

function checkCoolerCapacity(cooler, cpu, warnings) {
    if (!cooler || !cpu) return;

    const coolingCapacity = Number(
        cooler.compatibility?.recommendedCpuPowerWatts ||
        cooler.specs?.recommendedCpuPowerWatts ||
        0
    );
    const cpuPower = Number(cpu.powerWatts || 0);

    if (coolingCapacity && cpuPower && cpuPower > coolingCapacity) {
        warnings.push(
            makeDiagnostic(
                "The cooler may be marginal for this CPU under sustained heavy load.",
                "cooler",
                "cpu"
            )
        );
    }
}

function checkPsu(psu, gpu, build, issues, warnings) {
    if (!psu) return;

    const psuWatts = Number(psu.compatibility?.wattage || psu.specs?.wattage || 0);
    const power = estimatePower({ ...build, psu: null });

    if (psuWatts && power.minimum && psuWatts < power.minimum) {
        issues.push(
            makeDiagnostic(
                `Estimated system load requires approximately ${power.minimum} W minimum, but the selected PSU is ${psuWatts} W.`,
                "psu"
            )
        );
    } else if (psuWatts && power.preferred && psuWatts < power.preferred) {
        warnings.push(
            makeDiagnostic(
                `The ${psuWatts} W PSU is usable by this estimate, but around ${power.preferred} W would provide better headroom.`,
                "psu"
            )
        );
    }

    if (!gpu) return;

    const gpuRecommendation = Number(
        gpu.compatibility?.recommendedPsuWatts ||
        gpu.specs?.recommendedPsuWatts ||
        0
    );

    if (gpuRecommendation && psuWatts && psuWatts < gpuRecommendation) {
        warnings.push(
            makeDiagnostic(
                `The GPU manufacturer-class recommendation is ${gpuRecommendation} W; the selected PSU is ${psuWatts} W.`,
                "psu",
                "gpu"
            )
        );
    }

    const connector =
        gpu.compatibility?.powerConnector ||
        gpu.specs?.powerConnector ||
        "";

    const native12V2x6 =
        psu.compatibility?.has12V2x6 ??
        psu.specs?.has12V2x6;

    if (connector === "12V-2x6" && native12V2x6 === false) {
        warnings.push(
            makeDiagnostic(
                "This GPU uses a 12V-2x6 power connection, while the PSU does not list a native 12V-2x6 cable. An approved adapter may be required.",
                "psu",
                "gpu"
            )
        );
    }

    const required8Pins = parseRequired8PinCount(connector);
    const available8Pins = Number(psu.compatibility?.pcie8PinConnectors || 0);

    if (required8Pins && available8Pins && required8Pins > available8Pins) {
        issues.push(
            makeDiagnostic(
                `This GPU requires ${required8Pins} PCIe 8-pin power connectors, but the PSU's current compatibility data lists ${available8Pins}.`,
                "psu",
                "gpu"
            )
        );
    }
}

function parseRequired8PinCount(connector) {
    if (!connector) return 0;
    if (connector === "8-pin") return 1;

    const match = String(connector).match(/^(\d+)x8-pin$/i);
    return match ? Number(match[1]) : 0;
}

function roundUp(value, step) {
    return Math.ceil(value / step) * step;
}
