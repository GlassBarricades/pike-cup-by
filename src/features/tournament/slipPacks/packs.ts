/** Printed draw-slip packs seeded per tournament. */
export type SlipPackSector = {
  tour_number: number
  mini_number: number
  sector_number: number
}

export type SlipPackCard = {
  code: string
  start_zone: 'A' | 'B'
  sort_order: number
  sectors: SlipPackSector[]
}

export type SlipPackId = 'pikecup' | 'boor'

/** PikeCup: 2×5, 70 cards from «Жеребьевка БУМАЖКИ.pdf». */
export const PIKECUP_SLIP_PACK: SlipPackCard[] = [
  {
    "code": "1A",
    "start_zone": "A",
    "sort_order": 1,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 13
      }
    ]
  },
  {
    "code": "2A",
    "start_zone": "A",
    "sort_order": 2,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 10
      }
    ]
  },
  {
    "code": "3A",
    "start_zone": "A",
    "sort_order": 3,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 18
      }
    ]
  },
  {
    "code": "4A",
    "start_zone": "A",
    "sort_order": 4,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 23
      }
    ]
  },
  {
    "code": "5A",
    "start_zone": "A",
    "sort_order": 5,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 29
      }
    ]
  },
  {
    "code": "6A",
    "start_zone": "A",
    "sort_order": 6,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 33
      }
    ]
  },
  {
    "code": "7A",
    "start_zone": "A",
    "sort_order": 7,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 7
      }
    ]
  },
  {
    "code": "8A",
    "start_zone": "A",
    "sort_order": 8,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 20
      }
    ]
  },
  {
    "code": "9A",
    "start_zone": "A",
    "sort_order": 9,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 17
      }
    ]
  },
  {
    "code": "10A",
    "start_zone": "A",
    "sort_order": 10,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 25
      }
    ]
  },
  {
    "code": "11A",
    "start_zone": "A",
    "sort_order": 11,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 30
      }
    ]
  },
  {
    "code": "12A",
    "start_zone": "A",
    "sort_order": 12,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 1
      }
    ]
  },
  {
    "code": "13A",
    "start_zone": "A",
    "sort_order": 13,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 5
      }
    ]
  },
  {
    "code": "14A",
    "start_zone": "A",
    "sort_order": 14,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 14
      }
    ]
  },
  {
    "code": "15A",
    "start_zone": "A",
    "sort_order": 15,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 27
      }
    ]
  },
  {
    "code": "16A",
    "start_zone": "A",
    "sort_order": 16,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 24
      }
    ]
  },
  {
    "code": "17A",
    "start_zone": "A",
    "sort_order": 17,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 32
      }
    ]
  },
  {
    "code": "18A",
    "start_zone": "A",
    "sort_order": 18,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 2
      }
    ]
  },
  {
    "code": "19A",
    "start_zone": "A",
    "sort_order": 19,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 8
      }
    ]
  },
  {
    "code": "20A",
    "start_zone": "A",
    "sort_order": 20,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 12
      }
    ]
  },
  {
    "code": "21A",
    "start_zone": "A",
    "sort_order": 21,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 21
      }
    ]
  },
  {
    "code": "22A",
    "start_zone": "A",
    "sort_order": 22,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 34
      }
    ]
  },
  {
    "code": "23A",
    "start_zone": "A",
    "sort_order": 23,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 31
      }
    ]
  },
  {
    "code": "24A",
    "start_zone": "A",
    "sort_order": 24,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 4
      }
    ]
  },
  {
    "code": "25A",
    "start_zone": "A",
    "sort_order": 25,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 9
      }
    ]
  },
  {
    "code": "26A",
    "start_zone": "A",
    "sort_order": 26,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 15
      }
    ]
  },
  {
    "code": "27A",
    "start_zone": "A",
    "sort_order": 27,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 19
      }
    ]
  },
  {
    "code": "28A",
    "start_zone": "A",
    "sort_order": 28,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 28
      }
    ]
  },
  {
    "code": "29A",
    "start_zone": "A",
    "sort_order": 29,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 6
      }
    ]
  },
  {
    "code": "30A",
    "start_zone": "A",
    "sort_order": 30,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 3
      }
    ]
  },
  {
    "code": "31A",
    "start_zone": "A",
    "sort_order": 31,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 11
      }
    ]
  },
  {
    "code": "32A",
    "start_zone": "A",
    "sort_order": 32,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 16
      }
    ]
  },
  {
    "code": "33A",
    "start_zone": "A",
    "sort_order": 33,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 22
      }
    ]
  },
  {
    "code": "34A",
    "start_zone": "A",
    "sort_order": 34,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 26
      }
    ]
  },
  {
    "code": "35A",
    "start_zone": "A",
    "sort_order": 35,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 35
      }
    ]
  },
  {
    "code": "1B",
    "start_zone": "B",
    "sort_order": 36,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 13
      }
    ]
  },
  {
    "code": "2B",
    "start_zone": "B",
    "sort_order": 37,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 10
      }
    ]
  },
  {
    "code": "3B",
    "start_zone": "B",
    "sort_order": 38,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 18
      }
    ]
  },
  {
    "code": "4B",
    "start_zone": "B",
    "sort_order": 39,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 23
      }
    ]
  },
  {
    "code": "5B",
    "start_zone": "B",
    "sort_order": 40,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 29
      }
    ]
  },
  {
    "code": "6B",
    "start_zone": "B",
    "sort_order": 41,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 33
      }
    ]
  },
  {
    "code": "7B",
    "start_zone": "B",
    "sort_order": 42,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 7
      }
    ]
  },
  {
    "code": "8B",
    "start_zone": "B",
    "sort_order": 43,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 20
      }
    ]
  },
  {
    "code": "9B",
    "start_zone": "B",
    "sort_order": 44,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 17
      }
    ]
  },
  {
    "code": "10B",
    "start_zone": "B",
    "sort_order": 45,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 25
      }
    ]
  },
  {
    "code": "11B",
    "start_zone": "B",
    "sort_order": 46,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 30
      }
    ]
  },
  {
    "code": "12B",
    "start_zone": "B",
    "sort_order": 47,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 1
      }
    ]
  },
  {
    "code": "13B",
    "start_zone": "B",
    "sort_order": 48,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 5
      }
    ]
  },
  {
    "code": "14B",
    "start_zone": "B",
    "sort_order": 49,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 14
      }
    ]
  },
  {
    "code": "15B",
    "start_zone": "B",
    "sort_order": 50,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 27
      }
    ]
  },
  {
    "code": "16B",
    "start_zone": "B",
    "sort_order": 51,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 6
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 24
      }
    ]
  },
  {
    "code": "17B",
    "start_zone": "B",
    "sort_order": 52,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 32
      }
    ]
  },
  {
    "code": "18B",
    "start_zone": "B",
    "sort_order": 53,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 2
      }
    ]
  },
  {
    "code": "19B",
    "start_zone": "B",
    "sort_order": 54,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 8
      }
    ]
  },
  {
    "code": "20B",
    "start_zone": "B",
    "sort_order": 55,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 12
      }
    ]
  },
  {
    "code": "21B",
    "start_zone": "B",
    "sort_order": 56,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 21
      }
    ]
  },
  {
    "code": "22B",
    "start_zone": "B",
    "sort_order": 57,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 22
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 34
      }
    ]
  },
  {
    "code": "23B",
    "start_zone": "B",
    "sort_order": 58,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 31
      }
    ]
  },
  {
    "code": "24B",
    "start_zone": "B",
    "sort_order": 59,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 24
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 4
      }
    ]
  },
  {
    "code": "25B",
    "start_zone": "B",
    "sort_order": 60,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 9
      }
    ]
  },
  {
    "code": "26B",
    "start_zone": "B",
    "sort_order": 61,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 26
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 18
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 2
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 15
      }
    ]
  },
  {
    "code": "27B",
    "start_zone": "B",
    "sort_order": 62,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 19
      }
    ]
  },
  {
    "code": "28B",
    "start_zone": "B",
    "sort_order": 63,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 28
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 32
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 8
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 28
      }
    ]
  },
  {
    "code": "29B",
    "start_zone": "B",
    "sort_order": 64,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 16
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 6
      }
    ]
  },
  {
    "code": "30B",
    "start_zone": "B",
    "sort_order": 65,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 30
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 12
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 20
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 14
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 20
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 3
      }
    ]
  },
  {
    "code": "31B",
    "start_zone": "B",
    "sort_order": 66,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 2
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 18
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 11
      }
    ]
  },
  {
    "code": "32B",
    "start_zone": "B",
    "sort_order": 67,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 32
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 8
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 28
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 30
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 16
      }
    ]
  },
  {
    "code": "33B",
    "start_zone": "B",
    "sort_order": 68,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 4
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 14
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 16
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 22
      }
    ]
  },
  {
    "code": "34B",
    "start_zone": "B",
    "sort_order": 69,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 34
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 10
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 26
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 34
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 10
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 26
      }
    ]
  },
  {
    "code": "35B",
    "start_zone": "B",
    "sort_order": 70,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 6
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 4,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 5,
        "sector_number": 24
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 4
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 12
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 4,
        "sector_number": 22
      },
      {
        "tour_number": 2,
        "mini_number": 5,
        "sector_number": 35
      }
    ]
  }
]

/** BOOR / Western Cordon: 2×3, 74 cards (37 per zone, odd sectors 1–73) from «старты по секторам 74.xls». */
export const BOOR_SLIP_PACK: SlipPackCard[] = [
  {
    "code": "1A",
    "start_zone": "A",
    "sort_order": 1,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 73
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 3
      }
    ]
  },
  {
    "code": "3A",
    "start_zone": "A",
    "sort_order": 2,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 69
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 5
      }
    ]
  },
  {
    "code": "5A",
    "start_zone": "A",
    "sort_order": 3,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 65
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 7
      }
    ]
  },
  {
    "code": "7A",
    "start_zone": "A",
    "sort_order": 4,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 61
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 9
      }
    ]
  },
  {
    "code": "9A",
    "start_zone": "A",
    "sort_order": 5,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 57
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 11
      }
    ]
  },
  {
    "code": "11A",
    "start_zone": "A",
    "sort_order": 6,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 53
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 13
      }
    ]
  },
  {
    "code": "13A",
    "start_zone": "A",
    "sort_order": 7,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 49
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 15
      }
    ]
  },
  {
    "code": "15A",
    "start_zone": "A",
    "sort_order": 8,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 45
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 17
      }
    ]
  },
  {
    "code": "17A",
    "start_zone": "A",
    "sort_order": 9,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 41
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 19
      }
    ]
  },
  {
    "code": "19A",
    "start_zone": "A",
    "sort_order": 10,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 37
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 21
      }
    ]
  },
  {
    "code": "21A",
    "start_zone": "A",
    "sort_order": 11,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 23
      }
    ]
  },
  {
    "code": "23A",
    "start_zone": "A",
    "sort_order": 12,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 25
      }
    ]
  },
  {
    "code": "25A",
    "start_zone": "A",
    "sort_order": 13,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 27
      }
    ]
  },
  {
    "code": "27A",
    "start_zone": "A",
    "sort_order": 14,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 29
      }
    ]
  },
  {
    "code": "29A",
    "start_zone": "A",
    "sort_order": 15,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 31
      }
    ]
  },
  {
    "code": "31A",
    "start_zone": "A",
    "sort_order": 16,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 33
      }
    ]
  },
  {
    "code": "33A",
    "start_zone": "A",
    "sort_order": 17,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 35
      }
    ]
  },
  {
    "code": "35A",
    "start_zone": "A",
    "sort_order": 18,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 37
      }
    ]
  },
  {
    "code": "37A",
    "start_zone": "A",
    "sort_order": 19,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 37
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 39
      }
    ]
  },
  {
    "code": "39A",
    "start_zone": "A",
    "sort_order": 20,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 39
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 71
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 41
      }
    ]
  },
  {
    "code": "41A",
    "start_zone": "A",
    "sort_order": 21,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 41
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 67
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 43
      }
    ]
  },
  {
    "code": "43A",
    "start_zone": "A",
    "sort_order": 22,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 43
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 63
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 45
      }
    ]
  },
  {
    "code": "45A",
    "start_zone": "A",
    "sort_order": 23,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 45
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 59
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 47
      }
    ]
  },
  {
    "code": "47A",
    "start_zone": "A",
    "sort_order": 24,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 47
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 55
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 49
      }
    ]
  },
  {
    "code": "49A",
    "start_zone": "A",
    "sort_order": 25,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 49
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 51
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 51
      }
    ]
  },
  {
    "code": "51A",
    "start_zone": "A",
    "sort_order": 26,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 51
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 47
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 53
      }
    ]
  },
  {
    "code": "53A",
    "start_zone": "A",
    "sort_order": 27,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 53
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 43
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 55
      }
    ]
  },
  {
    "code": "55A",
    "start_zone": "A",
    "sort_order": 28,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 55
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 39
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 57
      }
    ]
  },
  {
    "code": "57A",
    "start_zone": "A",
    "sort_order": 29,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 57
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 59
      }
    ]
  },
  {
    "code": "59A",
    "start_zone": "A",
    "sort_order": 30,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 59
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 61
      }
    ]
  },
  {
    "code": "61A",
    "start_zone": "A",
    "sort_order": 31,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 61
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 63
      }
    ]
  },
  {
    "code": "63A",
    "start_zone": "A",
    "sort_order": 32,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 63
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 65
      }
    ]
  },
  {
    "code": "65A",
    "start_zone": "A",
    "sort_order": 33,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 65
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 67
      }
    ]
  },
  {
    "code": "67A",
    "start_zone": "A",
    "sort_order": 34,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 67
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 69
      }
    ]
  },
  {
    "code": "69A",
    "start_zone": "A",
    "sort_order": 35,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 69
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 71
      }
    ]
  },
  {
    "code": "71A",
    "start_zone": "A",
    "sort_order": 36,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 71
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 73
      }
    ]
  },
  {
    "code": "73A",
    "start_zone": "A",
    "sort_order": 37,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 73
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 1
      }
    ]
  },
  {
    "code": "1B",
    "start_zone": "B",
    "sort_order": 38,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 73
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 3
      }
    ]
  },
  {
    "code": "3B",
    "start_zone": "B",
    "sort_order": 39,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 69
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 5
      }
    ]
  },
  {
    "code": "5B",
    "start_zone": "B",
    "sort_order": 40,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 65
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 7
      }
    ]
  },
  {
    "code": "7B",
    "start_zone": "B",
    "sort_order": 41,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 61
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 9
      }
    ]
  },
  {
    "code": "9B",
    "start_zone": "B",
    "sort_order": 42,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 57
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 11
      }
    ]
  },
  {
    "code": "11B",
    "start_zone": "B",
    "sort_order": 43,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 53
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 47
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 13
      }
    ]
  },
  {
    "code": "13B",
    "start_zone": "B",
    "sort_order": 44,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 49
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 43
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 15
      }
    ]
  },
  {
    "code": "15B",
    "start_zone": "B",
    "sort_order": 45,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 45
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 51
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 17
      }
    ]
  },
  {
    "code": "17B",
    "start_zone": "B",
    "sort_order": 46,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 41
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 19
      }
    ]
  },
  {
    "code": "19B",
    "start_zone": "B",
    "sort_order": 47,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 37
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 55
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 21
      }
    ]
  },
  {
    "code": "21B",
    "start_zone": "B",
    "sort_order": 48,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 23
      }
    ]
  },
  {
    "code": "23B",
    "start_zone": "B",
    "sort_order": 49,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 59
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 25
      }
    ]
  },
  {
    "code": "25B",
    "start_zone": "B",
    "sort_order": 50,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 27
      }
    ]
  },
  {
    "code": "27B",
    "start_zone": "B",
    "sort_order": 51,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 63
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 29
      }
    ]
  },
  {
    "code": "29B",
    "start_zone": "B",
    "sort_order": 52,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 31
      }
    ]
  },
  {
    "code": "31B",
    "start_zone": "B",
    "sort_order": 53,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 67
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 33
      }
    ]
  },
  {
    "code": "33B",
    "start_zone": "B",
    "sort_order": 54,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 35
      }
    ]
  },
  {
    "code": "35B",
    "start_zone": "B",
    "sort_order": 55,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 37
      }
    ]
  },
  {
    "code": "37B",
    "start_zone": "B",
    "sort_order": 56,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 37
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 73
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 69
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 39
      }
    ]
  },
  {
    "code": "39B",
    "start_zone": "B",
    "sort_order": 57,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 39
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 71
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 65
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 41
      }
    ]
  },
  {
    "code": "41B",
    "start_zone": "B",
    "sort_order": 58,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 41
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 67
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 3
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 61
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 43
      }
    ]
  },
  {
    "code": "43B",
    "start_zone": "B",
    "sort_order": 59,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 43
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 63
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 57
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 45
      }
    ]
  },
  {
    "code": "45B",
    "start_zone": "B",
    "sort_order": 60,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 45
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 59
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 7
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 53
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 47
      }
    ]
  },
  {
    "code": "47B",
    "start_zone": "B",
    "sort_order": 61,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 47
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 55
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 49
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 49
      }
    ]
  },
  {
    "code": "49B",
    "start_zone": "B",
    "sort_order": 62,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 49
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 51
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 11
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 45
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 51
      }
    ]
  },
  {
    "code": "51B",
    "start_zone": "B",
    "sort_order": 63,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 51
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 47
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 41
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 53
      }
    ]
  },
  {
    "code": "53B",
    "start_zone": "B",
    "sort_order": 64,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 53
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 43
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 15
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 55
      }
    ]
  },
  {
    "code": "55B",
    "start_zone": "B",
    "sort_order": 65,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 55
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 39
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 57
      }
    ]
  },
  {
    "code": "57B",
    "start_zone": "B",
    "sort_order": 66,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 57
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 35
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 19
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 59
      }
    ]
  },
  {
    "code": "59B",
    "start_zone": "B",
    "sort_order": 67,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 59
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 31
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 61
      }
    ]
  },
  {
    "code": "61B",
    "start_zone": "B",
    "sort_order": 68,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 61
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 27
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 23
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 21
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 63
      }
    ]
  },
  {
    "code": "63B",
    "start_zone": "B",
    "sort_order": 69,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 63
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 23
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 25
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 17
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 65
      }
    ]
  },
  {
    "code": "65B",
    "start_zone": "B",
    "sort_order": 70,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 65
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 19
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 27
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 13
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 67
      }
    ]
  },
  {
    "code": "67B",
    "start_zone": "B",
    "sort_order": 71,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 67
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 15
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 29
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 9
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 69
      }
    ]
  },
  {
    "code": "69B",
    "start_zone": "B",
    "sort_order": 72,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 69
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 11
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 31
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 5
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 71
      }
    ]
  },
  {
    "code": "71B",
    "start_zone": "B",
    "sort_order": 73,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 71
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 7
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 33
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 37
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 1
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 73
      }
    ]
  },
  {
    "code": "73B",
    "start_zone": "B",
    "sort_order": 74,
    "sectors": [
      {
        "tour_number": 1,
        "mini_number": 1,
        "sector_number": 73
      },
      {
        "tour_number": 1,
        "mini_number": 2,
        "sector_number": 3
      },
      {
        "tour_number": 1,
        "mini_number": 3,
        "sector_number": 35
      },
      {
        "tour_number": 2,
        "mini_number": 1,
        "sector_number": 39
      },
      {
        "tour_number": 2,
        "mini_number": 2,
        "sector_number": 71
      },
      {
        "tour_number": 2,
        "mini_number": 3,
        "sector_number": 1
      }
    ]
  }
]

export function slipPackById(id: SlipPackId): SlipPackCard[] {
  return id === 'pikecup' ? PIKECUP_SLIP_PACK : BOOR_SLIP_PACK
}
