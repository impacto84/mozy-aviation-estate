/**
 * Relógio de cena: um único laço de frames, ligado e desligado por "portões".
 *
 * Regras do Piso que este módulo sustenta (CONSTITUTION.md, seção 1):
 *   P4  um relógio por cena  -> nunca há mais de um frame pendente;
 *   P5  pausa fora da tela   -> basta fechar um portão;
 *   P6  nada de setState por frame -> `onFrame` recebe valores, quem chama grava em ref/uniform.
 *
 * Uso mínimo:
 *
 *   const clock = createClock({ gates: ["ready", "in-view"], onFrame: ({ time }) => draw(time) });
 *   clock.setGate("ready", true);
 *   clock.setGate("in-view", true);   // só agora o laço começa
 *   clock.setGate("in-view", false);  // cancela o frame pendente
 *   clock.dispose();                  // no cleanup do efeito
 *
 * O tempo entregue é tempo de animação: não anda enquanto o relógio está parado,
 * então a cena retoma do ponto em que parou, sem salto.
 */

/** Tempos em segundos. `delta` é zero no primeiro frame e no primeiro depois de uma pausa. */
export interface FrameInfo {
  readonly time: number;
  readonly delta: number;
}

export type FrameCallback = (frame: FrameInfo) => void;

/** Quem agenda o próximo frame. O padrão é `requestAnimationFrame`; troque para dirigir pelo `gsap.ticker`. */
export interface FrameScheduler {
  readonly request: (callback: (timestampMs: number) => void) => number;
  readonly cancel: (handle: number) => void;
}

export interface ClockOptions<Gate extends string> {
  /** Condições que precisam estar todas abertas para o laço rodar. Começam fechadas. */
  readonly gates: readonly Gate[];
  readonly onFrame: FrameCallback;
  /** Chamado quando `onFrame` lança. O relógio para de vez. Sem ele, o erro é propagado. */
  readonly onError?: (error: unknown) => void;
  readonly scheduler?: FrameScheduler;
  /** Teto do delta, em segundos, para um frame longo não dar um salto na animação. */
  readonly maxDelta?: number;
  /** Tempo inicial, em segundos. Útil para o frame estático não ser o instante zero. */
  readonly initialTime?: number;
}

export interface Clock<Gate extends string> {
  readonly setGate: (gate: Gate, isOpen: boolean) => void;
  readonly isRunning: () => boolean;
  /** Tempo de animação acumulado, em segundos. */
  readonly time: () => number;
  /** Desenha um frame no tempo atual, com delta zero, sem agendar nada. */
  readonly renderStill: () => void;
  readonly dispose: () => void;
}

const MS_PER_SECOND = 1000;
const DEFAULT_MAX_DELTA_SECONDS = 0.1;

const BROWSER_SCHEDULER: FrameScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
};

function assertValidOptions<Gate extends string>(options: ClockOptions<Gate>): void {
  const { gates, maxDelta = DEFAULT_MAX_DELTA_SECONDS, initialTime = 0 } = options;
  if (gates.length === 0) {
    throw new RangeError("createClock: informe ao menos um portão em `gates`.");
  }
  if (new Set(gates).size !== gates.length) {
    throw new RangeError(`createClock: portões repetidos em \`gates\`: ${gates.join(", ")}.`);
  }
  if (!Number.isFinite(maxDelta) || maxDelta <= 0) {
    throw new RangeError(`createClock: \`maxDelta\` inválido (${String(maxDelta)}). Use segundos, maior que zero.`);
  }
  if (!Number.isFinite(initialTime) || initialTime < 0) {
    throw new RangeError(`createClock: \`initialTime\` inválido (${String(initialTime)}). Use segundos, zero ou mais.`);
  }
}

interface ResolvedClockOptions<Gate extends string> {
  readonly gates: readonly Gate[];
  readonly onFrame: FrameCallback;
  readonly onError: ((error: unknown) => void) | undefined;
  readonly scheduler: FrameScheduler;
  readonly maxDelta: number;
  readonly initialTime: number;
}

/**
 * Implementação do relógio. Os métodos são propriedades em arrow function para
 * poderem ser repassados soltos (`isRunning: clock.isRunning`) sem perder o `this`.
 */
class GatedClock<Gate extends string> implements Clock<Gate> {
  private readonly gateState: Map<Gate, boolean>;
  private elapsedSeconds: number;
  private lastTimestampMs: number | null = null;
  private pendingHandle: number | null = null;
  private isStopped = false;

  constructor(private readonly options: ResolvedClockOptions<Gate>) {
    this.gateState = new Map(options.gates.map((gate) => [gate, false]));
    this.elapsedSeconds = options.initialTime;
  }

  readonly setGate = (gate: Gate, isOpen: boolean): void => {
    if (!this.gateState.has(gate)) {
      const declared = this.options.gates.join(", ");
      throw new RangeError(`createClock: portão desconhecido "${gate}". Declarados: ${declared}.`);
    }
    this.gateState.set(gate, isOpen);
    this.sync();
  };

  readonly isRunning = (): boolean => this.pendingHandle !== null;

  readonly time = (): number => this.elapsedSeconds;

  readonly renderStill = (): void => {
    if (!this.isStopped) {
      this.emit(0);
    }
  };

  readonly dispose = (): void => {
    this.isStopped = true;
    this.sync();
  };

  private shouldRun(): boolean {
    return !this.isStopped && [...this.gateState.values()].every(Boolean);
  }

  private emit(delta: number): void {
    try {
      this.options.onFrame({ time: this.elapsedSeconds, delta });
    } catch (error) {
      this.isStopped = true;
      if (this.options.onError === undefined) {
        throw error;
      }
      this.options.onError(error);
    }
  }

  private readonly tick = (timestampMs: number): void => {
    this.pendingHandle = null;
    const rawDelta = this.lastTimestampMs === null ? 0 : (timestampMs - this.lastTimestampMs) / MS_PER_SECOND;
    const delta = Math.min(Math.max(rawDelta, 0), this.options.maxDelta);
    this.lastTimestampMs = timestampMs;
    this.elapsedSeconds += delta;
    this.emit(delta);
    if (this.shouldRun()) {
      this.pendingHandle = this.options.scheduler.request(this.tick);
    }
  };

  /** Liga ou desliga o laço conforme os portões. Nunca deixa mais de um frame pendente. */
  private sync(): void {
    if (this.shouldRun()) {
      if (this.pendingHandle === null) {
        this.lastTimestampMs = null;
        this.pendingHandle = this.options.scheduler.request(this.tick);
      }
      return;
    }
    if (this.pendingHandle !== null) {
      this.options.scheduler.cancel(this.pendingHandle);
      this.pendingHandle = null;
    }
  }
}

export function createClock<Gate extends string>(options: ClockOptions<Gate>): Clock<Gate> {
  assertValidOptions(options);
  return new GatedClock<Gate>({
    gates: options.gates,
    onFrame: options.onFrame,
    onError: options.onError,
    scheduler: options.scheduler ?? BROWSER_SCHEDULER,
    maxDelta: options.maxDelta ?? DEFAULT_MAX_DELTA_SECONDS,
    initialTime: options.initialTime ?? 0,
  });
}
