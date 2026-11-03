// Motor Prolog con lazy loading
// Solo se carga cuando el usuario elige jugar contra la IA

let prologInstance: any = null;
let isLoading = false;

export interface PrologMove {
  letter: string;
  position: number;
  reasoning: string[];
  score: number;
}

export class PrologEngine {
  private static instance: PrologEngine | null = null;
  private prolog: any = null;
  private initialized = false;

  private constructor() {}

  static async getInstance(): Promise<PrologEngine> {
    if (!PrologEngine.instance) {
      PrologEngine.instance = new PrologEngine();
      await PrologEngine.instance.initialize();
    }
    return PrologEngine.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (isLoading) {
      // Esperar a que otra instancia termine de cargar
      while (isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    isLoading = true;
    try {
      // Importación dinámica del bundle single-file para lazy loading
      // El bundle incluye .wasm y .data embebidos
      const module = await import('swipl-wasm/dist/swipl/swipl-bundle.js');
      const SWIPL = module.default;
      
      this.prolog = await SWIPL({
        arguments: ['-q']
      });

      // Cargar las reglas del juego
      await this.loadGameRules();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Prolog:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  }

  private async loadGameRules(): Promise<void> {
    const rules = `
      % ============================================
      % REGLAS DEL JUEGO PALABRAX3 EN PROLOG
      % ============================================
      
      % Líneas del tablero (índices 0-8)
      linea([0,1,2]).  % Fila superior
      linea([3,4,5]).  % Fila media
      linea([6,7,8]).  % Fila inferior
      linea([0,3,6]).  % Columna izquierda
      linea([1,4,7]).  % Columna central
      linea([2,5,8]).  % Columna derecha
      linea([0,4,8]).  % Diagonal principal
      linea([2,4,6]).  % Diagonal secundaria
      
      % Obtener todas las líneas
      todas_lineas(Lineas) :-
        findall(L, linea(L), Lineas).
      
      % Verificar si una posición está vacía
      posicion_vacia(Tablero, Pos) :-
        nth0(Pos, Tablero, Valor),
        Valor = ''.
      
      % Obtener letras de una línea
      letras_linea(Tablero, Linea, Letras) :-
        maplist(nth0_wrap(Tablero), Linea, Letras).
      
      nth0_wrap(List, Index, Element) :-
        nth0(Index, List, Element).
      
      % Verificar si una línea está completa
      linea_completa(Tablero, Linea) :-
        letras_linea(Tablero, Linea, Letras),
        \\+ member('', Letras).
      
      % Verificar si una línea forma palabra válida
      forma_palabra(Tablero, Linea, Palabra) :-
        linea_completa(Tablero, Linea),
        letras_linea(Tablero, Linea, Letras),
        atom_chars(Palabra, Letras),
        palabra_valida(Palabra).
      
      % ============================================
      % ESTRATEGIA DE LA IA
      % ============================================
      
      % Evaluar una jugada potencial
      evaluar_jugada(Tablero, Letra, Posicion, Puntuacion) :-
        % Simular la jugada
        copy_term(Tablero, NuevoTablero),
        nth0(Posicion, NuevoTablero, Letra),
        
        % Contar palabras formadas
        findall(P, forma_palabra(NuevoTablero, _, P), Palabras),
        length(Palabras, NumPalabras),
        
        % Calcular puntuación base
        PuntuacionBase is NumPalabras * 3,
        
        % Bonus por posición central
        (Posicion =:= 4 -> BonusCentro = 2 ; BonusCentro = 0),
        
        % Bonus por bloquear al oponente
        evaluar_bloqueo(Tablero, Letra, Posicion, BonusBloqueo),
        
        % Puntuación final
        Puntuacion is PuntuacionBase + BonusCentro + BonusBloqueo.
      
      % Evaluar si una jugada bloquea al oponente
      evaluar_bloqueo(Tablero, Letra, Posicion, Bonus) :-
        % Buscar líneas donde el oponente podría formar palabra
        findall(L, (
          linea(L),
          member(Posicion, L),
          letras_linea(Tablero, L, Letras),
          % La línea tiene 2 letras y un espacio vacío
          select('', Letras, [A, B]),
          A \\= '',
          B \\= ''
        ), LineasAmenazadas),
        length(LineasAmenazadas, NumAmenazas),
        Bonus is NumAmenazas * 2.
      
      % Encontrar la mejor jugada
      mejor_jugada(Tablero, Diccionario, Letra, MejorPosicion, Puntuacion, Razonamiento) :-
      % Obtener todas las posiciones vacías
      findall(Pos, posicion_vacia(Tablero, Pos), PosicionesVacias),
      
      % Evaluar cada posición
      findall(
        Puntuacion-Posicion,
        (
          member(Posicion, PosicionesVacias),
          evaluar_jugada(Tablero, Letra, Posicion, Puntuacion)
        ),
        Jugadas
      ),
      
      % Ordenar por puntuación (mayor primero)
      msort(Jugadas, JugadasOrdenadas),
      reverse(JugadasOrdenadas, JugadasInversas),
      
      % Seleccionar la mejor
      JugadasInversas = [MaxPuntuacion-MejorPosicion | _],
      Puntuacion = MaxPuntuacion,
      
      % Generar razonamiento
      generar_razonamiento(Tablero, Letra, MejorPosicion, Puntuacion, Razonamiento).
      
      % Generar explicación del razonamiento
      generar_razonamiento(Tablero, Letra, Posicion, Puntuacion, Razonamiento) :-
        Razonamiento = [
          'Analizando tablero con backtracking...',
          'Evaluando todas las posiciones vacías mediante unificación',
          'Calculando palabras que se pueden formar',
          'Aplicando heurísticas de bloqueo y posición central',
          'Seleccionando jugada óptima por ordenación'
        ].
      
      % ============================================
      % UTILIDADES
      % ============================================
      
      % Contar posiciones vacías
      contar_vacias(Tablero, Count) :-
        findall(_, posicion_vacia(Tablero, _), Vacias),
        length(Vacias, Count).
      
      % Verificar si el tablero está lleno
      tablero_lleno(Tablero) :-
        \\+ posicion_vacia(Tablero, _).
    `;

    // Ejecutar las reglas
    this.prolog.call(rules);
  }

  async loadDictionary(words: string[]): Promise<void> {
    // Cargar el diccionario como hechos Prolog
    const facts = words.map(w => `palabra_valida('${w}').`).join('\n');
    
    // Limpiar hechos anteriores si existen
    try {
      this.prolog.call('retractall(palabra_valida(_)).');
    } catch (e) {
      // Ignorar si no existen
    }
    
    this.prolog.call(facts);
  }

  async calculateBestMove(
    board: (string | null)[],
    letter: string
  ): Promise<PrologMove> {
    // Convertir tablero al formato Prolog
    const prologBoard = board.map(cell => cell || '');
    
    // Consultar la mejor jugada
    const query = `
      mejor_jugada(
        [${prologBoard.map(l => `'${l}'`).join(',')}],
        _,
        '${letter}',
        Posicion,
        Puntuacion,
        Razonamiento
      )
    `;

    try {
      const result = this.prolog.query(query).once();
      
      if (result) {
        return {
          letter,
          position: result.Posicion,
          reasoning: result.Razonamiento || [],
          score: result.Puntuacion || 0
        };
      }
    } catch (error) {
      console.error('Error calculating move:', error);
    }

    // Fallback: jugada aleatoria si Prolog falla
    const emptyPositions = board
      .map((cell, idx) => cell === null ? idx : -1)
      .filter(idx => idx !== -1);
    
    const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    
    return {
      letter,
      position: randomPos,
      reasoning: ['Fallback: selección aleatoria'],
      score: 0
    };
  }

  async executeQuery(query: string): Promise<any> {
    try {
      return this.prolog.query(query).once();
    } catch (error) {
      console.error('Query error:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
