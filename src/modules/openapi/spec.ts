function createPaginatedResponseSchema(itemSchema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        example: 50,
      },
      catalogTotal: {
        type: 'integer',
        example: 1350,
      },
      page: {
        type: ['integer', 'null'],
        example: 1,
      },
      pageSize: {
        type: ['integer', 'null'],
        example: 20,
      },
      items: {
        type: 'array',
        items: itemSchema,
      },
    },
    required: ['total', 'items'],
  }
}

function createStringQueryParameter(name: string, description: string) {
  return {
    name,
    in: 'query',
    required: false,
    description,
    schema: {
      type: 'string',
    },
  }
}

function createIntegerQueryParameter(name: string, description: string) {
  return {
    name,
    in: 'query',
    required: false,
    description,
    schema: {
      type: 'integer',
      minimum: 0,
    },
  }
}

function createBooleanQueryParameter(name: string, description: string) {
  return {
    name,
    in: 'query',
    required: false,
    description,
    schema: {
      type: 'boolean',
    },
  }
}

function createErrorResponses(notFoundDescription?: string) {
  const responses: Record<string, unknown> = {
    500: {
      description: 'Database or server error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse',
          },
        },
      },
    },
  }

  if (notFoundDescription) {
    responses[404] = {
      description: notFoundDescription,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse',
          },
        },
      },
    }
  }

  return responses
}

export function buildOpenApiSpec(baseUrl: string) {
  const errorSchema = {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        example: 'No se pudo consultar la base de datos.',
      },
    },
    required: ['error'],
  }

  const pokemonCatalogItemSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      slug: { type: 'string', example: 'bulbasaur' },
      label: { type: 'string', example: 'Bulbasaur' },
      image: { type: ['string', 'null'], example: 'https://example.com/image.png' },
      thumb: { type: ['string', 'null'], example: 'https://example.com/thumb.png' },
    },
    required: ['id', 'slug', 'label', 'image', 'thumb'],
  }

  const pokemonDetailSchema = {
    type: 'object',
    properties: {
      isPlaceholder: { type: 'boolean', example: false },
      id: { type: 'string', example: '#0001' },
      slug: { type: 'string', example: 'bulbasaur' },
      name: { type: 'string', example: 'Bulbasaur' },
      image: { type: 'string', example: '/pokemon/artwork/1.png' },
      thumb: { type: 'string', example: '/pokemon/sprites/1.png' },
      type: { type: 'string', example: 'Planta' },
      types: {
        type: 'array',
        items: { type: 'string' },
        example: ['Planta', 'Veneno'],
      },
      typeKeys: {
        type: 'array',
        items: { type: 'string' },
        example: ['grass', 'poison'],
      },
      hp: { type: 'integer', example: 45 },
      attack: { type: 'integer', example: 49 },
      defense: { type: 'integer', example: 49 },
      specialAttack: { type: 'integer', example: 65 },
      specialDefense: { type: 'integer', example: 65 },
      speed: { type: 'integer', example: 45 },
      bonus: { type: 'string', example: 'Overgrow' },
      description: { type: 'string' },
      role: { type: 'string', example: 'Presion ofensiva' },
      palette: { type: 'string', example: 'grass' },
      height: { type: ['number', 'null'], example: 0.7 },
      weight: { type: ['number', 'null'], example: 6.9 },
      levelMoves: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Latigo Cepa' },
            level: { type: 'integer', example: 7 },
          },
          required: ['name', 'level'],
        },
      },
      heldItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Baya Zidra' },
            rarity: { type: ['integer', 'null'], example: 5 },
          },
          required: ['name', 'rarity'],
        },
      },
    },
    required: [
      'isPlaceholder',
      'id',
      'slug',
      'name',
      'image',
      'thumb',
      'type',
      'types',
      'typeKeys',
      'hp',
      'attack',
      'defense',
      'specialAttack',
      'specialDefense',
      'speed',
      'bonus',
      'description',
      'role',
      'palette',
      'height',
      'weight',
      'levelMoves',
      'heldItems',
    ],
  }

  const pokemonMoveLearnItemSchema = {
    type: 'object',
    properties: {
      move: { type: 'string', example: 'Drenadoras' },
      moveSlug: { type: 'string', example: 'leech-seed' },
      type: { type: 'string', example: 'Planta' },
      typeKey: { type: 'string', example: 'grass' },
      category: { type: 'string', example: 'Estado' },
      categoryKey: { type: ['string', 'null'], example: 'status' },
      power: { type: ['integer', 'null'], example: null },
      accuracy: { type: ['integer', 'null'], example: 90 },
      pp: { type: ['integer', 'null'], example: 10 },
      priority: { type: ['integer', 'null'], example: 0 },
      learnMethods: {
        type: 'array',
        items: { type: 'string' },
        example: ['Level Up', 'Machine'],
      },
      learnMethodKeys: {
        type: 'array',
        items: { type: 'string' },
        example: ['level-up', 'machine'],
      },
      versionGroups: {
        type: 'array',
        items: { type: 'string' },
        example: ['Scarlet Violet'],
      },
      versionGroupKeys: {
        type: 'array',
        items: { type: 'string' },
        example: ['scarlet-violet'],
      },
      level: { type: ['integer', 'null'], example: 7 },
    },
    required: [
      'move',
      'moveSlug',
      'type',
      'typeKey',
      'category',
      'categoryKey',
      'power',
      'accuracy',
      'pp',
      'priority',
      'learnMethods',
      'learnMethodKeys',
      'versionGroups',
      'versionGroupKeys',
      'level',
    ],
  }

  const typeChartEntrySchema = {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'fire' },
      doubleDamageFrom: {
        type: 'array',
        items: { type: 'string' },
        example: ['water', 'ground', 'rock'],
      },
      halfDamageFrom: {
        type: 'array',
        items: { type: 'string' },
        example: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
      },
      noDamageFrom: {
        type: 'array',
        items: { type: 'string' },
        example: [],
      },
    },
    required: ['name', 'doubleDamageFrom', 'halfDamageFrom', 'noDamageFrom'],
  }

  const pokedexSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 2 },
      name: { type: 'string', example: 'Kanto' },
      slug: { type: 'string', example: 'kanto' },
      isMainSeries: { type: 'boolean', example: true },
      regionName: { type: ['string', 'null'], example: 'kanto' },
      entries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            entryNumber: { type: 'integer', example: 1 },
            speciesId: { type: 'integer', example: 1 },
            speciesSlug: { type: 'string', example: 'bulbasaur' },
            speciesName: { type: 'string', example: 'Bulbasaur' },
          },
          required: ['entryNumber', 'speciesId', 'speciesSlug', 'speciesName'],
        },
      },
    },
    required: ['id', 'name', 'slug', 'isMainSeries', 'regionName', 'entries'],
  }

  const pokemonSummaryViewSchema = {
    type: 'object',
    properties: {
      pokemon_id: { type: 'integer', example: 1 },
      pokemon_slug: { type: 'string', example: 'bulbasaur' },
      species_id: { type: 'integer', example: 1 },
      species_slug: { type: 'string', example: 'bulbasaur' },
      showdown_id: { type: ['string', 'null'], example: 'bulbasaur' },
      generation_id: { type: 'integer', example: 1 },
      generation_name: { type: 'string', example: 'generation-i' },
      is_default: { type: 'boolean', example: true },
      is_legendary: { type: 'boolean', example: false },
      is_mythical: { type: 'boolean', example: false },
      primary_type: { type: ['string', 'null'], example: 'grass' },
      secondary_type: { type: ['string', 'null'], example: 'poison' },
      primary_ability: { type: ['string', 'null'], example: 'overgrow' },
      hp: { type: ['integer', 'null'], example: 45 },
      attack: { type: ['integer', 'null'], example: 49 },
      defense: { type: ['integer', 'null'], example: 49 },
      special_attack: { type: ['integer', 'null'], example: 65 },
      special_defense: { type: ['integer', 'null'], example: 65 },
      speed: { type: ['integer', 'null'], example: 45 },
      base_stat_total: { type: 'integer', example: 318 },
      height_m: { type: ['number', 'null'], example: 0.7 },
      weight_kg: { type: ['number', 'null'], example: 6.9 },
      base_experience: { type: ['integer', 'null'], example: 64 },
      official_artwork_url: { type: ['string', 'null'], example: '/pokemon/artwork/1.png' },
      sprite_url: { type: ['string', 'null'], example: '/pokemon/sprites/1.png' },
    },
    required: [
      'pokemon_id',
      'pokemon_slug',
      'species_id',
      'species_slug',
      'showdown_id',
      'generation_id',
      'generation_name',
      'is_default',
      'is_legendary',
      'is_mythical',
      'primary_type',
      'secondary_type',
      'primary_ability',
      'hp',
      'attack',
      'defense',
      'special_attack',
      'special_defense',
      'speed',
      'base_stat_total',
      'height_m',
      'weight_kg',
      'base_experience',
      'official_artwork_url',
      'sprite_url',
    ],
  }

  const pokemonMoveLearnViewSchema = {
    type: 'object',
    properties: {
      pokemon_move_learn_id: { type: 'integer', example: 1 },
      pokemon_id: { type: 'integer', example: 1 },
      pokemon_slug: { type: 'string', example: 'bulbasaur' },
      species_id: { type: 'integer', example: 1 },
      species_slug: { type: 'string', example: 'bulbasaur' },
      move_id: { type: 'integer', example: 73 },
      move_slug: { type: 'string', example: 'leech-seed' },
      move_type: { type: 'string', example: 'grass' },
      version_group_id: { type: 'integer', example: 25 },
      version_group: { type: 'string', example: 'scarlet-violet' },
      move_learn_method_id: { type: 'integer', example: 1 },
      move_learn_method: { type: 'string', example: 'level-up' },
      level_learned_at: { type: 'integer', example: 7 },
      sort_order: { type: 'integer', example: 0 },
    },
    required: [
      'pokemon_move_learn_id',
      'pokemon_id',
      'pokemon_slug',
      'species_id',
      'species_slug',
      'move_id',
      'move_slug',
      'move_type',
      'version_group_id',
      'version_group',
      'move_learn_method_id',
      'move_learn_method',
      'level_learned_at',
      'sort_order',
    ],
  }

  const pokemonPokedexEntryViewSchema = {
    type: 'object',
    properties: {
      pokedex_entry_id: { type: 'integer', example: 1 },
      pokedex_id: { type: 'integer', example: 2 },
      pokedex_slug: { type: 'string', example: 'kanto' },
      is_main_series: { type: 'boolean', example: true },
      region_name: { type: ['string', 'null'], example: 'kanto' },
      entry_number: { type: 'integer', example: 1 },
      species_id: { type: 'integer', example: 1 },
      species_slug: { type: 'string', example: 'bulbasaur' },
      default_pokemon_id: { type: ['integer', 'null'], example: 1 },
      default_pokemon_slug: { type: ['string', 'null'], example: 'bulbasaur' },
      primary_type: { type: ['string', 'null'], example: 'grass' },
      secondary_type: { type: ['string', 'null'], example: 'poison' },
      official_artwork_url: { type: ['string', 'null'], example: '/pokemon/artwork/1.png' },
    },
    required: [
      'pokedex_entry_id',
      'pokedex_id',
      'pokedex_slug',
      'is_main_series',
      'region_name',
      'entry_number',
      'species_id',
      'species_slug',
      'default_pokemon_id',
      'default_pokemon_slug',
      'primary_type',
      'secondary_type',
      'official_artwork_url',
    ],
  }

  const pokemonCompetitiveOverviewViewSchema = {
    type: 'object',
    properties: {
      pokemon_format_id: { type: 'string', example: 'cm9example' },
      format_key: { type: 'string', example: 'gen9ou' },
      format_name: { type: 'string', example: '[Gen 9] OU' },
      tier_scope: { type: ['string', 'null'], example: 'singles' },
      tier_key: { type: ['string', 'null'], example: 'OU' },
      tier_name: { type: ['string', 'null'], example: 'OU' },
      showdown_pokemon_id: { type: 'string', example: 'venusaur' },
      pokemon_id: { type: ['integer', 'null'], example: 3 },
      pokemon_slug: { type: ['string', 'null'], example: 'venusaur' },
      species_id: { type: ['integer', 'null'], example: 3 },
      species_slug: { type: ['string', 'null'], example: 'venusaur' },
      primary_type: { type: ['string', 'null'], example: 'grass' },
      secondary_type: { type: ['string', 'null'], example: 'poison' },
      is_sample_set_available: { type: 'boolean', example: true },
      sample_set_count: { type: 'integer', example: 3 },
      is_usage_tracked: { type: 'boolean', example: true },
      latest_usage_month: { type: ['string', 'null'], example: '2026-02' },
      latest_usage_rating: { type: ['integer', 'null'], example: 1825 },
      latest_usage_percent: { type: ['number', 'null'], example: 0.0493782 },
      is_nonstandard: { type: ['string', 'null'], example: null },
    },
    required: [
      'pokemon_format_id',
      'format_key',
      'format_name',
      'tier_scope',
      'tier_key',
      'tier_name',
      'showdown_pokemon_id',
      'pokemon_id',
      'pokemon_slug',
      'species_id',
      'species_slug',
      'primary_type',
      'secondary_type',
      'is_sample_set_available',
      'sample_set_count',
      'is_usage_tracked',
      'latest_usage_month',
      'latest_usage_rating',
      'latest_usage_percent',
      'is_nonstandard',
    ],
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Pokemon Project Internal API',
      version: '1.0.0',
      description:
        'Documentacion Swagger/OpenAPI de la API interna que consulta PostgreSQL a traves de Prisma. Incluye endpoints funcionales de dominio y endpoints read-only sobre views SQL.',
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current environment',
      },
    ],
    tags: [
      { name: 'Pokemon', description: 'Catalogo principal y fichas Pokemon' },
      { name: 'Pokedex', description: 'Pokedexes y entradas por especie' },
      { name: 'Team', description: 'Type chart para analisis de equipos' },
      { name: 'Views', description: 'Read models SQL expuestos como API read-only' },
    ],
    paths: {
      '/api/pokemon': {
        get: {
          tags: ['Pokemon'],
          summary: 'List pokemon catalog',
          description: 'Devuelve el catalogo de Pokemon disponible en la base de datos local.',
          parameters: [
            createStringQueryParameter('query', 'Filtra por nombre, slug, id textual, habilidad o tipo.'),
            createIntegerQueryParameter('page', 'Pagina a devolver cuando quieras paginacion desde servidor.'),
            createIntegerQueryParameter('pageSize', 'Numero de Pokemon por pagina.'),
            createStringQueryParameter('scope', 'Usa "competitive" para limitar el catalogo al meta activo.'),
            createStringQueryParameter('formatKey', 'Formato competitivo usado para acotar el catalogo cuando scope=competitive.'),
          ],
          responses: {
            200: {
              description: 'Pokemon catalog',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonCatalogItemSchema),
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
      '/api/pokemon/{name}': {
        get: {
          tags: ['Pokemon'],
          summary: 'Get pokemon detail',
          description: 'Devuelve la ficha agregada de un Pokemon por nombre o id.',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'Pokemon slug o id numerico.',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Pokemon detail',
              content: {
                'application/json': {
                  schema: pokemonDetailSchema,
                },
              },
            },
            ...createErrorResponses('Pokemon not found'),
          },
        },
      },
      '/api/pokemon/{name}/moves': {
        get: {
          tags: ['Pokemon'],
          summary: 'Get pokemon learnset',
          description: 'Devuelve el learnset normalizado del Pokemon por nombre o id.',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'Pokemon slug o id numerico.',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Pokemon moves',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonMoveLearnItemSchema),
                },
              },
            },
            ...createErrorResponses('Pokemon not found'),
          },
        },
      },
      '/api/team/type-chart': {
        get: {
          tags: ['Team'],
          summary: 'Get defensive type chart',
          description: 'Devuelve la tabla de relaciones de tipos usada por el analisis de equipos.',
          responses: {
            200: {
              description: 'Type chart',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: typeChartEntrySchema,
                  },
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
      '/api/pokedex/{id}': {
        get: {
          tags: ['Pokedex'],
          summary: 'Get pokedex by id',
          description: 'Devuelve una pokedex con sus entradas ordenadas.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Identificador numerico de la pokedex.',
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            200: {
              description: 'Pokedex detail',
              content: {
                'application/json': {
                  schema: pokedexSchema,
                },
              },
            },
            400: {
              description: 'Invalid pokedex id',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            ...createErrorResponses('Pokedex not found'),
          },
        },
      },
      '/api/views/pokemon-summary': {
        get: {
          tags: ['Views'],
          summary: 'Read pokemon_summary_view',
          description: 'Consulta read-only de la vista SQL pokemon_summary_view.',
          parameters: [
            createStringQueryParameter('pokemonSlug', 'Filtra por pokemon_slug.'),
            createStringQueryParameter('speciesSlug', 'Filtra por species_slug.'),
            createStringQueryParameter('generationName', 'Filtra por generation_name.'),
            createStringQueryParameter('primaryType', 'Filtra por primary_type.'),
            createBooleanQueryParameter('isDefault', 'Filtra por is_default.'),
            createIntegerQueryParameter('limit', 'Numero maximo de filas a devolver.'),
            createIntegerQueryParameter('offset', 'Desplazamiento para paginacion.'),
          ],
          responses: {
            200: {
              description: 'pokemon_summary_view rows',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonSummaryViewSchema),
                },
              },
            },
            400: {
              description: 'Invalid query parameter',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
      '/api/views/pokemon-move-learn': {
        get: {
          tags: ['Views'],
          summary: 'Read pokemon_move_learn_view',
          description: 'Consulta read-only de la vista SQL pokemon_move_learn_view.',
          parameters: [
            createStringQueryParameter('pokemonSlug', 'Filtra por pokemon_slug.'),
            createStringQueryParameter('moveSlug', 'Filtra por move_slug.'),
            createStringQueryParameter('moveType', 'Filtra por move_type.'),
            createStringQueryParameter('moveLearnMethod', 'Filtra por move_learn_method.'),
            createStringQueryParameter('versionGroup', 'Filtra por version_group.'),
            createIntegerQueryParameter('limit', 'Numero maximo de filas a devolver.'),
            createIntegerQueryParameter('offset', 'Desplazamiento para paginacion.'),
          ],
          responses: {
            200: {
              description: 'pokemon_move_learn_view rows',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonMoveLearnViewSchema),
                },
              },
            },
            400: {
              description: 'Invalid query parameter',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
      '/api/views/pokedex-entries': {
        get: {
          tags: ['Views'],
          summary: 'Read pokemon_pokedex_entry_view',
          description: 'Consulta read-only de la vista SQL pokemon_pokedex_entry_view.',
          parameters: [
            createStringQueryParameter('pokedexSlug', 'Filtra por pokedex_slug.'),
            createStringQueryParameter('speciesSlug', 'Filtra por species_slug.'),
            createStringQueryParameter('defaultPokemonSlug', 'Filtra por default_pokemon_slug.'),
            createIntegerQueryParameter('limit', 'Numero maximo de filas a devolver.'),
            createIntegerQueryParameter('offset', 'Desplazamiento para paginacion.'),
          ],
          responses: {
            200: {
              description: 'pokemon_pokedex_entry_view rows',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonPokedexEntryViewSchema),
                },
              },
            },
            400: {
              description: 'Invalid query parameter',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
      '/api/views/competitive-overview': {
        get: {
          tags: ['Views'],
          summary: 'Read pokemon_competitive_overview_view',
          description: 'Consulta read-only de la vista SQL pokemon_competitive_overview_view.',
          parameters: [
            createStringQueryParameter('formatKey', 'Filtra por format_key.'),
            createStringQueryParameter('showdownPokemonId', 'Filtra por showdown_pokemon_id.'),
            createStringQueryParameter('pokemonSlug', 'Filtra por pokemon_slug.'),
            createStringQueryParameter('tierKey', 'Filtra por tier_key.'),
            createStringQueryParameter('latestUsageMonth', 'Filtra por latest_usage_month.'),
            createBooleanQueryParameter('isSampleSetAvailable', 'Filtra por is_sample_set_available.'),
            createBooleanQueryParameter('isUsageTracked', 'Filtra por is_usage_tracked.'),
            createIntegerQueryParameter('limit', 'Numero maximo de filas a devolver.'),
            createIntegerQueryParameter('offset', 'Desplazamiento para paginacion.'),
          ],
          responses: {
            200: {
              description: 'pokemon_competitive_overview_view rows',
              content: {
                'application/json': {
                  schema: createPaginatedResponseSchema(pokemonCompetitiveOverviewViewSchema),
                },
              },
            },
            400: {
              description: 'Invalid query parameter',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            ...createErrorResponses(),
          },
        },
      },
    },
    components: {
      schemas: {
        ErrorResponse: errorSchema,
      },
    },
  }
}
