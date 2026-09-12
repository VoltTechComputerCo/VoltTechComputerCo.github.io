export function getCompatibility(product, build) {
    const issues = [];
    const warnings = [];
    const unknowns = [];

    const selected = {
        cpu: product.type === "cpu" ? product : build.cpu,
        motherboard: product.type === "motherboard" ? product : build.motherboard,
        memory: product.type === "memory"
            ? [...asList(build.memory), product]
            : asList(build.memory),
        gpu: product.type === "gpu" ? product : build.gpu,
        storage: product.type === "storage"
            ? [...asList(build.storage), product]
            : asList(build.storage),
        psu: product.type === "psu" ? product : build.psu,
        case: product.type === "case" ? product : build.case,
        cooler: product.type === "cooler" ? product : build.cooler
    };

    runChecks(selected, issues, warnings, unknowns);

    return result(issues, warnings, unknowns);
}

export function validateBuild(build) {
    const issues = [];
    const warnings = [];
    const unknowns = [];

    runChecks(build, issues, warnings, unknowns);

    if (build.cpu && build.cpu.specs?.coolerIncluded === false && !build.cooler) {
        warnings.push(makeDiagnostic(
            "This CPU does not include a cooler. Add a compatible CPU cooler.",
            "cooler", "cpu", "cpu-cooler-required"
        ));
    }

    return result(issues, warnings, unknowns);
}

export function estimatePower(build) {
    const componentPower = Object.values(build)
        .flatMap(value => Array.isArray(value) ? value : value ? [value] : [])
        .reduce((total, product) => total + Number(product.powerWatts || 0), 0);

    const systemAllowance = 65;
    const estimated = componentPower > 0 ? componentPower + systemAllowance : 0;
    const minimum = estimated > 0 ? roundUp(estimated * 1.20, 50) : 0;
    const preferred = estimated > 0 ? roundUp(estimated * 1.35, 50) : 0;

    return { estimated, minimum, preferred };
}

function result(issues, warnings, unknowns) {
    return {
        compatible: issues.length === 0,
        confirmed: issues.length === 0 && unknowns.length === 0,
        status: issues.length ? "incompatible" : unknowns.length ? "unknown" : warnings.length ? "warning" : "compatible",
        issues,
        warnings,
        unknowns
    };
}

function runChecks(build, issues, warnings, unknowns) {
    checkCpuMotherboard(build.cpu, build.motherboard, issues, warnings, unknowns);
    asList(build.memory).forEach(memory => checkMemoryMotherboard(memory, build.motherboard, issues, unknowns));
    checkCombinedMemory(build.memory, build.motherboard, issues, warnings);
    asList(build.storage).forEach(storage => checkStorageMotherboard(storage, build.motherboard, issues, warnings, unknowns));
    checkCombinedStorage(build.storage, build.motherboard, issues);
    checkMotherboardCase(build.motherboard, build.case, issues, unknowns);
    checkGpuCase(build.gpu, build.case, issues, unknowns);
    checkCoolerCpu(build.cooler, build.cpu, issues, unknowns);
    checkCoolerCase(build.cooler, build.case, issues, unknowns);
    asList(build.memory).forEach(memory => checkRamCooler(memory, build.cooler, warnings));
    checkCoolerCapacity(build.cooler, build.cpu, warnings);
    checkCpuBoardPowerSuitability(build.cpu, build.motherboard, warnings);
    checkPsu(build.psu, build.gpu, build, issues, warnings, unknowns);
}

function makeDiagnostic(text, category, alternateCategory = null, code = null) {
    return { text, category, alternateCategory, code };
}

function checkCpuMotherboard(cpu, motherboard, issues, warnings, unknowns) {
    if (!cpu || !motherboard) return;

    const cpuSocket = cpu.compatibility?.socket || cpu.specs?.socket;
    const boardSocket = motherboard.compatibility?.socket || motherboard.specs?.socket;

    if (!cpuSocket || !boardSocket) {
        unknowns.push(makeDiagnostic(
            "CPU-to-motherboard socket compatibility cannot be confirmed because socket data is incomplete.",
            "motherboard", "cpu", "cpu-board-socket-unknown"
        ));
        return;
    }

    if (cpuSocket !== boardSocket) {
        issues.push(makeDiagnostic(
            `CPU socket ${cpuSocket} does not match motherboard socket ${boardSocket}.`,
            "motherboard", "cpu", "cpu-board-socket"
        ));
        return;
    }

    const chipset = motherboard.compatibility?.chipset || motherboard.specs?.chipset;
    const supportedChipsets = cpu.compatibility?.supportedChipsets || [];

    if (chipset && supportedChipsets.length && !supportedChipsets.includes(chipset)) {
        issues.push(makeDiagnostic(
            `${cpu.compatibility?.cpuFamily || "This CPU"} is not listed as supported by the motherboard's ${chipset} chipset in the current compatibility data.`,
            "motherboard", "cpu", "cpu-board-chipset"
        ));
        return;
    }

    if (!chipset || !supportedChipsets.length) {
        unknowns.push(makeDiagnostic(
            "Socket compatibility is known, but CPU/chipset support is not fully confirmed in the current data.",
            "motherboard", "cpu", "cpu-board-chipset-unknown"
        ));
    }

    const biosList = cpu.compatibility?.biosMayRequireUpdateChipsets || [];
    if (chipset && biosList.includes(chipset)) {
        const flashback = motherboard.specs?.biosFlashback === true;
        warnings.push(makeDiagnostic(
            flashback
                ? `This CPU and ${chipset} motherboard may require a BIOS update. This board lists BIOS Flashback, which can make updating easier.`
                : `This CPU and ${chipset} motherboard may require a BIOS update before the CPU will boot. Verify the board's shipped BIOS version before assembly.`,
            "motherboard", "cpu", "cpu-board-bios"
        ));
    }
}

function checkMemoryMotherboard(memory, motherboard, issues, unknowns) {
    if (!memory || !motherboard) return;

    const memoryType = memory.compatibility?.memoryType || memory.specs?.memoryType;
    const boardMemory = motherboard.compatibility?.memoryType || motherboard.specs?.memoryType;

    if (!memoryType || !boardMemory) {
        unknowns.push(makeDiagnostic(
            "Memory generation compatibility cannot be confirmed because DDR type data is incomplete.",
            "memory", "motherboard", "memory-board-type-unknown"
        ));
    } else if (memoryType !== boardMemory) {
        issues.push(makeDiagnostic(
            `${memoryType} memory cannot be used with a ${boardMemory} motherboard.`,
            "memory", "motherboard", "memory-board-type"
        ));
    }

    const modules = Number(memory.compatibility?.modules ?? memory.specs?.modules ?? 0);
    const rawDimmSlots = motherboard.compatibility?.dimmSlots ?? motherboard.specs?.dimmSlots;
    const dimmSlots = Number(rawDimmSlots || 0);

    if (modules && rawDimmSlots === undefined) {
        unknowns.push(makeDiagnostic(
            "The memory kit's DIMM count is known, but motherboard DIMM-slot count is missing.",
            "motherboard", "memory", "memory-board-slots-unknown"
        ));
    } else if (modules && dimmSlots && modules > dimmSlots) {
        issues.push(makeDiagnostic(
            `This memory kit requires ${modules} DIMM slots, but the motherboard only has ${dimmSlots}.`,
            "memory", "motherboard", "memory-board-slots"
        ));
    }

    const capacityGB = Number(memory.compatibility?.capacityGB ?? memory.specs?.capacityGB ?? 0);
    const rawMax = motherboard.compatibility?.maxMemoryGB ?? motherboard.specs?.maxMemoryGB;
    const maxMemoryGB = Number(rawMax || 0);

    if (capacityGB && rawMax === undefined) {
        unknowns.push(makeDiagnostic(
            "Motherboard maximum memory capacity is not available, so total RAM capacity cannot be fully confirmed.",
            "motherboard", "memory", "memory-board-capacity-unknown"
        ));
    } else if (capacityGB && maxMemoryGB && capacityGB > maxMemoryGB) {
        issues.push(makeDiagnostic(
            `This memory kit is ${capacityGB} GB, but the motherboard is listed for up to ${maxMemoryGB} GB.`,
            "memory", "motherboard", "memory-board-capacity"
        ));
    }
}

function checkStorageMotherboard(storage, motherboard, issues, warnings, unknowns) {
    if (!storage || !motherboard) return;

    const interfaceType = storage.compatibility?.interface || storage.specs?.interface;
    if (!interfaceType) {
        unknowns.push(makeDiagnostic(
            "Storage interface data is missing, so motherboard connectivity cannot be confirmed.",
            "storage", "motherboard", "storage-interface-unknown"
        ));
        return;
    }

    const rawM2 = motherboard.compatibility?.m2Slots ?? motherboard.specs?.m2Slots;
    const rawSata = motherboard.compatibility?.sataPorts ?? motherboard.specs?.sataPorts;
    const m2Slots = Number(rawM2 || 0);
    const sataPorts = Number(rawSata || 0);

    if (interfaceType === "NVMe") {
        if (rawM2 === undefined) {
            unknowns.push(makeDiagnostic(
                "The motherboard's M.2 slot count is missing, so NVMe installation cannot be fully confirmed.",
                "motherboard", "storage", "storage-m2-slots-unknown"
            ));
        } else if (m2Slots < 1) {
            issues.push(makeDiagnostic(
                "This NVMe drive requires an M.2 slot, but the motherboard does not list one.",
                "storage", "motherboard", "storage-m2-slots"
            ));
        }

        const driveGen = Number(storage.compatibility?.pcieGeneration ?? storage.specs?.pcieGeneration ?? 0);
        const rawBoardGen = motherboard.compatibility?.maxM2PcieGeneration ?? motherboard.specs?.maxM2PcieGeneration;
        const boardGen = Number(rawBoardGen || 0);

        if (driveGen && rawBoardGen === undefined) {
            unknowns.push(makeDiagnostic(
                "The NVMe drive's PCIe generation is known, but the motherboard's maximum M.2 PCIe generation is missing.",
                "motherboard", "storage", "storage-pcie-gen-unknown"
            ));
        } else if (driveGen && boardGen && driveGen > boardGen) {
            warnings.push(makeDiagnostic(
                `This PCIe ${driveGen}.0 NVMe drive can be installed, but the motherboard's current M.2 compatibility data tops out at PCIe ${boardGen}.0, so the drive may run below its maximum interface speed.`,
                "motherboard", "storage", "storage-pcie-gen"
            ));
        }
    }

    if (interfaceType === "SATA") {
        if (rawSata === undefined) {
            unknowns.push(makeDiagnostic(
                "The motherboard's SATA port count is missing, so SATA-drive connectivity cannot be fully confirmed.",
                "motherboard", "storage", "storage-sata-unknown"
            ));
        } else if (sataPorts < 1) {
            issues.push(makeDiagnostic(
                "This SATA drive requires a SATA port, but the motherboard does not list one.",
                "storage", "motherboard", "storage-sata"
            ));
        }
    }
}

function checkMotherboardCase(motherboard, pcCase, issues, unknowns) {
    if (!motherboard || !pcCase) return;

    const formFactor = motherboard.compatibility?.formFactor || motherboard.specs?.formFactor;
    const supported = pcCase.compatibility?.supportedMotherboardSizes || pcCase.specs?.supportedMotherboardSizes;

    if (!formFactor || !Array.isArray(supported) || !supported.length) {
        unknowns.push(makeDiagnostic(
            "Motherboard-to-case form-factor fit cannot be fully confirmed because size-support data is incomplete.",
            "case", "motherboard", "board-case-form-factor-unknown"
        ));
        return;
    }

    if (!supported.includes(formFactor)) {
        issues.push(makeDiagnostic(
            `${formFactor} motherboard does not fit this case.`,
            "case", "motherboard", "board-case-form-factor"
        ));
    }
}

function checkGpuCase(gpu, pcCase, issues, unknowns) {
    if (!gpu || !pcCase) return;

    const gpuLength = Number(gpu.compatibility?.lengthMm || gpu.specs?.lengthMm || 0);
    const maxLengthRaw = pcCase.compatibility?.maxGpuLengthMm ?? pcCase.specs?.maxGpuLengthMm;
    const maxLength = Number(maxLengthRaw || 0);

    if (!gpuLength || maxLengthRaw === undefined) {
        unknowns.push(makeDiagnostic(
            "GPU length clearance cannot be confirmed because length data is missing.",
            "case", "gpu", "gpu-case-length-unknown"
        ));
    } else if (gpuLength > maxLength) {
        issues.push(makeDiagnostic(
            `GPU length is ${gpuLength} mm, but this case supports up to ${maxLength} mm.`,
            "case", "gpu", "gpu-case-length"
        ));
    }

    // Slot-width is only used when BOTH products publish a meaningful limit.
    // Missing slot-width data no longer creates an uncertainty warning by itself.
    const gpuSlotsRaw = gpu.compatibility?.slotWidth ?? gpu.specs?.slots ?? gpu.specs?.slotWidth;
    const caseSlotsRaw = pcCase.compatibility?.maxGpuSlotWidth ?? pcCase.specs?.maxGpuSlotWidth;

    if (gpuSlotsRaw !== undefined && caseSlotsRaw !== undefined) {
        const gpuSlots = Number(gpuSlotsRaw);
        const caseSlots = Number(caseSlotsRaw);

        if (gpuSlots && caseSlots && gpuSlots > caseSlots) {
            issues.push(makeDiagnostic(
                `GPU thickness is approximately ${gpuSlots} slots, but this case supports up to ${caseSlots} slots.`,
                "case", "gpu", "gpu-case-thickness"
            ));
        }
    }
}

function checkCoolerCpu(cooler, cpu, issues, unknowns) {
    if (!cooler || !cpu) return;

    const cpuSocket = cpu.compatibility?.socket || cpu.specs?.socket;
    const sockets = cooler.compatibility?.supportedSockets || cooler.specs?.supportedSockets;

    if (!cpuSocket || !Array.isArray(sockets) || !sockets.length) {
        unknowns.push(makeDiagnostic(
            "CPU-cooler socket support cannot be fully confirmed because socket data is incomplete.",
            "cooler", "cpu", "cooler-cpu-socket-unknown"
        ));
        return;
    }

    if (!sockets.includes(cpuSocket)) {
        issues.push(makeDiagnostic(
            `This cooler does not support the CPU's ${cpuSocket} socket.`,
            "cooler", "cpu", "cooler-cpu-socket"
        ));
    }
}

function checkCoolerCase(cooler, pcCase, issues, unknowns) {
    if (!cooler || !pcCase) return;

    const coolerType = cooler.specs?.coolerType;

    if (coolerType === "air") {
        const height = Number(cooler.compatibility?.heightMm || cooler.specs?.heightMm || 0);
        const maxRaw = pcCase.compatibility?.maxCpuCoolerHeightMm ?? pcCase.specs?.maxCpuCoolerHeightMm;
        const maxHeight = Number(maxRaw || 0);

        if (!height || maxRaw === undefined) {
            unknowns.push(makeDiagnostic(
                "Air-cooler height clearance cannot be confirmed because a required height measurement is missing.",
                "cooler", "case", "cooler-case-height-unknown"
            ));
        } else if (height > maxHeight) {
            issues.push(makeDiagnostic(
                `CPU cooler is ${height} mm tall, but this case supports up to ${maxHeight} mm.`,
                "cooler", "case", "cooler-case-height"
            ));
        }

        return;
    }

    if (coolerType === "aio") {
        const radiator = Number(cooler.compatibility?.radiatorSizeMm || cooler.specs?.radiatorSizeMm || 0);
        const supported = pcCase.compatibility?.radiatorSupportMm || pcCase.specs?.radiatorSupportMm;

        if (!radiator || !Array.isArray(supported) || !supported.length) {
            unknowns.push(makeDiagnostic(
                "Radiator fit cannot be confirmed because radiator-size support data is missing.",
                "cooler", "case", "aio-case-size-unknown"
            ));
            return;
        }

        if (!supported.includes(radiator)) {
            issues.push(makeDiagnostic(
                `${radiator} mm radiator is not supported by this case.`,
                "cooler", "case", "aio-case-size"
            ));
            return;
        }

        // If the case explicitly publishes per-position support, use it to reject a
        // combination only when the data proves there is no valid mounting location.
        const radiatorPositions = cooler.compatibility?.radiatorPositions || cooler.specs?.radiatorPositions;
        const casePositions = pcCase.compatibility?.radiatorSupportByPosition || pcCase.specs?.radiatorSupportByPosition;

        if (casePositions && typeof casePositions === "object") {
            const possiblePositions = Object.entries(casePositions)
                .filter(([, sizes]) => Array.isArray(sizes) && sizes.includes(radiator))
                .map(([position]) => position);

            if (!possiblePositions.length) {
                issues.push(makeDiagnostic(
                    `${radiator} mm radiator is listed for this case generally, but no valid mounting position is available in the case's detailed compatibility data.`,
                    "cooler", "case", "aio-case-position"
                ));
                return;
            }

            if (Array.isArray(radiatorPositions) && radiatorPositions.length) {
                const overlap = radiatorPositions.some(position => possiblePositions.includes(position));
                if (!overlap) {
                    issues.push(makeDiagnostic(
                        `${radiator} mm radiator is supported by the case, but the cooler's allowed mounting positions do not match the case's available positions.`,
                        "cooler", "case", "aio-case-position"
                    ));
                }
            }
        }

        // Important: if the case supports the radiator size but does not publish
        // position-level data, the builder accepts the fit instead of creating
        // a permanent "unknown" warning.
    }
}

function checkRamCooler(memory, cooler, warnings) {
    if (!memory || !cooler || cooler.specs?.coolerType !== "air") return;

    const ramHeightRaw = memory.compatibility?.heightMm ?? memory.specs?.heightMm;
    const coolerClearanceRaw = cooler.compatibility?.maxRamHeightMm ?? cooler.specs?.maxRamHeightMm;

    // Only warn when both measurements exist and prove a likely clearance issue.
    // Missing optional RAM-height data should not make the whole build "unknown".
    if (ramHeightRaw !== undefined && coolerClearanceRaw !== undefined) {
        const ramHeight = Number(ramHeightRaw);
        const maxHeight = Number(coolerClearanceRaw);

        if (ramHeight && maxHeight && ramHeight > maxHeight) {
            warnings.push(makeDiagnostic(
                `RAM height is ${ramHeight} mm while the air cooler lists approximately ${maxHeight} mm RAM clearance. Fan position or DIMM clearance may need adjustment.`,
                "cooler", "memory", "ram-cooler-clearance"
            ));
        }
    }
}

function checkCombinedMemory(memoryValue, motherboard, issues, warnings) {
    const memory = asList(memoryValue);
    if (!memory.length || !motherboard) return;

    const totalModules = memory.reduce((n,p)=>n+Number(p.compatibility?.modules ?? p.specs?.modules ?? 0),0);
    const totalCapacity = memory.reduce((n,p)=>n+Number(p.compatibility?.capacityGB ?? p.specs?.capacityGB ?? 0),0);
    const dimmSlots = Number(motherboard.compatibility?.dimmSlots ?? motherboard.specs?.dimmSlots ?? 0);
    const maxCapacity = Number(motherboard.compatibility?.maxMemoryGB ?? motherboard.specs?.maxMemoryGB ?? 0);
    const types = [...new Set(memory.map(p=>p.compatibility?.memoryType || p.specs?.memoryType).filter(Boolean))];

    if (types.length > 1) {
        issues.push(makeDiagnostic("Selected memory kits use different DDR generations and cannot be mixed.","memory","motherboard","memory-mixed-ddr"));
    }
    if (dimmSlots && totalModules > dimmSlots) {
        issues.push(makeDiagnostic(`Selected memory uses ${totalModules} DIMMs, but the motherboard only has ${dimmSlots} DIMM slots.`,"memory","motherboard","memory-total-slots"));
    }
    if (maxCapacity && totalCapacity > maxCapacity) {
        issues.push(makeDiagnostic(`Selected memory totals ${totalCapacity} GB, but the motherboard supports up to ${maxCapacity} GB.`,"memory","motherboard","memory-total-capacity"));
    }
    if (memory.length > 1) {
        const speeds=[...new Set(memory.map(p=>Number(p.specs?.speedMTs||0)).filter(Boolean))];
        const latencies=[...new Set(memory.map(p=>Number(p.specs?.casLatency||0)).filter(Boolean))];
        if (speeds.length>1 || latencies.length>1) {
            warnings.push(makeDiagnostic("Multiple RAM kits with different speed or latency specifications may run at the slowest common settings. A matched kit is preferred.","memory","motherboard","memory-mixed-kit"));
        }
    }
}

function checkCombinedStorage(storageValue, motherboard, issues) {
    const storage=asList(storageValue);
    if (!storage.length || !motherboard) return;
    const nvme=storage.filter(p=>(p.compatibility?.interface||p.specs?.interface)==="NVMe").length;
    const sata=storage.filter(p=>(p.compatibility?.interface||p.specs?.interface)==="SATA").length;
    const m2=Number(motherboard.compatibility?.m2Slots ?? motherboard.specs?.m2Slots ?? 0);
    const sataPorts=Number(motherboard.compatibility?.sataPorts ?? motherboard.specs?.sataPorts ?? 0);
    if(m2 && nvme>m2)issues.push(makeDiagnostic(`The build has ${nvme} NVMe drives but the motherboard lists ${m2} M.2 slots.`,"storage","motherboard","storage-total-m2"));
    if(sataPorts && sata>sataPorts)issues.push(makeDiagnostic(`The build has ${sata} SATA drives but the motherboard lists ${sataPorts} SATA ports.`,"storage","motherboard","storage-total-sata"));
}

function asList(value){return Array.isArray(value)?value:(value?[value]:[])}

function checkCoolerCapacity(cooler, cpu, warnings) {
    if (!cooler || !cpu) return;

    const coolingCapacity = Number(cooler.compatibility?.recommendedCpuPowerWatts || cooler.specs?.recommendedCpuPowerWatts || 0);
    const cpuPower = Number(cpu.powerWatts || 0);

    if (coolingCapacity && cpuPower && cpuPower > coolingCapacity) {
        warnings.push(makeDiagnostic(
            "The cooler may be marginal for this CPU under sustained heavy load.",
            "cooler", "cpu", "cooler-capacity"
        ));
    }
}

function checkCpuBoardPowerSuitability(cpu, motherboard, warnings) {
    if (!cpu || !motherboard) return;

    const cpuPower = Number(cpu.powerWatts || 0);
    const boardClass = Number(
        motherboard.compatibility?.recommendedCpuPowerWatts ??
        motherboard.specs?.recommendedCpuPowerWatts ??
        0
    );

    if (cpuPower && boardClass && cpuPower > boardClass) {
        warnings.push(makeDiagnostic(
            `The CPU is rated around ${cpuPower} W in the current dataset, while this motherboard's suitability target is around ${boardClass} W. It may work, but power delivery and sustained boost behaviour should be checked.`,
            "motherboard", "cpu", "cpu-board-power"
        ));
    }
}

function checkPsu(psu, gpu, build, issues, warnings, unknowns) {
    if (!psu) return;

    const psuWatts = Number(psu.compatibility?.wattage || psu.specs?.wattage || 0);
    const power = estimatePower({ ...build, psu: null });

    if (!psuWatts) {
        unknowns.push(makeDiagnostic(
            "PSU wattage data is missing, so power-capacity compatibility cannot be confirmed.",
            "psu", null, "psu-wattage-unknown"
        ));
    } else if (power.minimum && psuWatts < power.minimum) {
        issues.push(makeDiagnostic(
            `Estimated system load requires approximately ${power.minimum} W minimum, but the selected PSU is ${psuWatts} W.`,
            "psu", null, "psu-capacity"
        ));
    } else if (power.preferred && psuWatts < power.preferred) {
        warnings.push(makeDiagnostic(
            `The ${psuWatts} W PSU is usable by this estimate, but around ${power.preferred} W would provide better headroom.`,
            "psu", null, "psu-headroom"
        ));
    }

    if (!gpu) return;

    const gpuRecommendation = Number(gpu.compatibility?.recommendedPsuWatts || gpu.specs?.recommendedPsuWatts || 0);
    if (gpuRecommendation && psuWatts && psuWatts < gpuRecommendation) {
        warnings.push(makeDiagnostic(
            `The GPU manufacturer-class recommendation is ${gpuRecommendation} W; the selected PSU is ${psuWatts} W.`,
            "psu", "gpu", "gpu-psu-recommendation"
        ));
    }

    const connector = gpu.compatibility?.powerConnector || gpu.specs?.powerConnector || "";
    if (!connector) {
        unknowns.push(makeDiagnostic(
            "GPU power-connector requirements are missing, so PSU cable compatibility cannot be confirmed.",
            "gpu", "psu", "gpu-connector-unknown"
        ));
        return;
    }

    const native12V2x6 = psu.compatibility?.has12V2x6 ?? psu.specs?.has12V2x6;

    if (connector === "12V-2x6") {
        if (native12V2x6 === false) {
            warnings.push(makeDiagnostic(
                "This GPU uses a 12V-2x6 power connection, while the PSU does not list a native 12V-2x6 cable. An approved adapter may be required.",
                "psu", "gpu", "gpu-12v2x6"
            ));
        } else if (native12V2x6 === undefined) {
            unknowns.push(makeDiagnostic(
                "This GPU uses 12V-2x6, but the PSU's native 12V-2x6 cable support is not confirmed.",
                "psu", "gpu", "gpu-12v2x6-unknown"
            ));
        }
    }

    const required8Pins = parseRequired8PinCount(connector);
    const availableRaw = psu.compatibility?.pcie8PinConnectors ?? psu.specs?.pcie8PinConnectors;

    if (required8Pins) {
        if (availableRaw === undefined) {
            unknowns.push(makeDiagnostic(
                `This GPU requires ${required8Pins} PCIe 8-pin connector${required8Pins === 1 ? "" : "s"}, but the PSU connector count is not confirmed.`,
                "psu", "gpu", "gpu-8pin-count-unknown"
            ));
        } else {
            const available8Pins = Number(availableRaw || 0);
            if (required8Pins > available8Pins) {
                issues.push(makeDiagnostic(
                    `This GPU requires ${required8Pins} PCIe 8-pin power connectors, but the PSU's current compatibility data lists ${available8Pins}.`,
                    "psu", "gpu", "gpu-8pin-count"
                ));
            }
        }
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
