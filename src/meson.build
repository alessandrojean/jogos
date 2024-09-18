gnome = import('gnome')

sources = files(
  'main.ts',
  'application.ts',
  'window.ts',
  'settings.ts',
  'model/certification.ts',
  'model/currency.ts',
  'model/game.ts',
  'model/gameCondition.ts',
  'model/platform.ts',
  'model/storageMedia.ts',
  'widgets/contextMenuBin.ts',
  'widgets/preferencesDialog.ts',
  'widgets/sidebarItem.ts',
  'lib/fetch.ts',
  'igdb/api.ts',
  'games/createGameDialog.ts',
  'games/editGameDialog.ts',
  'games/gameDetailsDialog.ts',
  'games/gameGridItem.ts',
  'games/gameTitleColumn.ts',
  'games/gamesView.ts',
  'games/onlineGameResult.ts',
  'utils/cover.ts',
  'utils/createFolder.ts',
  'utils/debugInfo.ts',
  'utils/locale.ts',
  'utils/validators.ts',
  'repositories/database.ts',
  'repositories/games.ts',
)

tsc_out = meson.project_build_root() / 'tsc-out'

typescript = custom_target(
  'typescript-compile',
  input: sources,
  build_by_default: true,
  build_always_stale: true,
  command: [ tsc, '--outDir', tsc_out ],
  output: ['tsc-output'],
)

src_res = gnome.compile_resources(
  'io.github.alessandrojean.jogos.src',
  'io.github.alessandrojean.jogos.src.gresource.xml',
  dependencies: typescript,
  source_dir: tsc_out,
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

bin_conf = configuration_data()
bin_conf.set('GJS', gjs_console)
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_conf.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))
bin_conf.set('resource_path', '/io/github/alessandrojean/jogos')

app_launcher = configure_file(
  input: 'io.github.alessandrojean.jogos.in',
  output: 'io.github.alessandrojean.jogos',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir')
)

run_target(
  'devel',
  command: [gjs_console, '-m', app_launcher],
  depends: [src_res, data_res, compile_local_schemas]
)
