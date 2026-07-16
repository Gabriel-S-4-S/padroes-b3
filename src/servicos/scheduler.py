import time
from datetime import datetime

from logs.logger import logger

from servicos.estado_scheduler import (
    laboratorio_ja_executado,
    marcar_laboratorio_executado,
    marcar_scanner_executado,
    obter_resumo_estado,
    scanner_ja_executado,
)

from servicos.horarios import (
    deve_executar_laboratorio,
    formatar_momento,
    horario_programado_laboratorio,
    horario_scanner_correspondente,
    horario_scanner_perdido,
    proxima_execucao_laboratorio,
    proximo_horario_scanner,
)

from servicos.laboratorio_service import (
    executar_laboratorio_service,
)

from servicos.monitoramento_scheduler_db import (
    atualizar_status_scheduler,
    criar_tabelas_monitoramento_scheduler,
    marcar_scheduler_offline,
    registrar_fim_laboratorio,
    registrar_fim_scanner,
    registrar_inicio_execucao,
)

from servicos.scanner_service import (
    executar_scanner_service,
)


INTERVALO_VERIFICACAO_SEGUNDOS = 30


class Scheduler:
    def __init__(self):
        self.executando = True
        self.scanner_em_execucao = False
        self.laboratorio_em_execucao = False

        self.iniciado_em = datetime.now()

    def calcular_proximas_execucoes(
        self,
        agora: datetime | None = None,
    ) -> tuple[datetime | None, datetime | None]:
        if agora is None:
            agora = datetime.now()

        proximo_scanner = None
        proximo_laboratorio = None

        try:
            proximo_scanner = proximo_horario_scanner(
                agora
            )
        except Exception as erro:
            logger.erro(
                "Não foi possível calcular o próximo "
                f"scanner: {erro}"
            )

        try:
            proximo_laboratorio = (
                proxima_execucao_laboratorio(
                    agora
                )
            )
        except Exception as erro:
            logger.erro(
                "Não foi possível calcular o próximo "
                f"laboratório: {erro}"
            )

        return (
            proximo_scanner,
            proximo_laboratorio,
        )

    def atualizar_monitoramento_online(
        self,
    ) -> None:
        agora = datetime.now()

        (
            proximo_scanner,
            proximo_laboratorio,
        ) = self.calcular_proximas_execucoes(
            agora
        )

        atualizar_status_scheduler(
            status="online",
            proximo_scanner=(
                proximo_scanner.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if proximo_scanner
                else None
            ),
            proximo_laboratorio=(
                proximo_laboratorio.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if proximo_laboratorio
                else None
            ),
            processo_iniciado_em=(
                self.iniciado_em.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            ),
        )

    def mostrar_inicializacao(self):
        estado = obter_resumo_estado()
        agora = datetime.now()

        (
            proximo_scanner,
            proximo_laboratorio,
        ) = self.calcular_proximas_execucoes(
            agora
        )

        print()
        print("=" * 60)
        print("SERVIÇO PADRÕES B3")
        print("=" * 60)

        print(
            "Iniciado em:",
            formatar_momento(agora),
        )

        print(
            "Último scanner:",
            estado["ultimo_scanner"]
            or "Nunca executado",
        )

        print(
            "Último laboratório:",
            estado["ultimo_laboratorio"]
            or "Nunca executado",
        )

        print(
            "Próximo scanner:",
            (
                formatar_momento(proximo_scanner)
                if proximo_scanner
                else "Não foi possível calcular"
            ),
        )

        print(
            "Próximo laboratório:",
            (
                formatar_momento(
                    proximo_laboratorio
                )
                if proximo_laboratorio
                else "Não foi possível calcular"
            ),
        )

        print()
        print("Scheduler em execução...")
        print("Pressione Ctrl+C para encerrar.")

    def executar_scanner(
        self,
        horario_programado: datetime,
        recuperacao: bool = False,
    ):
        if self.scanner_em_execucao:
            logger.info(
                "Scanner não iniciado porque já existe "
                "uma execução em andamento."
            )
            return

        if scanner_ja_executado(
            horario_programado
        ):
            return

        self.scanner_em_execucao = True

        execucao_id = registrar_inicio_execucao(
            tipo="scanner",
            horario_programado=(
                horario_programado.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            ),
            recuperacao=recuperacao,
        )

        inicio_execucao = time.time()

        tipo_execucao = (
            "RECUPERAÇÃO DE EXECUÇÃO PERDIDA"
            if recuperacao
            else "EXECUÇÃO PROGRAMADA"
        )

        print()
        print("=" * 60)
        print("SCANNER AUTOMÁTICO")
        print("=" * 60)
        print("Tipo:", tipo_execucao)

        print(
            "Horário programado:",
            formatar_momento(
                horario_programado
            ),
        )

        print(
            "Início real:",
            formatar_momento(
                datetime.now()
            ),
        )

        logger.info(
            "Scanner automático iniciado. "
            f"Horário programado: "
            f"{horario_programado.isoformat()}. "
            f"Recuperação: {recuperacao}."
        )

        try:
            resultado = executar_scanner_service()

            sucesso = bool(
                resultado
                and resultado.get("sucesso")
            )

            duracao = (
                time.time() - inicio_execucao
            )

            if not sucesso:
                mensagem_erro = (
                    "O serviço do scanner terminou "
                    "sem indicar sucesso."
                )

                registrar_fim_scanner(
                    execucao_id=execucao_id,
                    status="erro",
                    duracao_segundos=duracao,
                    erro=mensagem_erro,
                )

                logger.erro(mensagem_erro)

                print(mensagem_erro)

                print(
                    "O horário não será marcado "
                    "como concluído."
                )

                return

            marcar_scanner_executado(
                horario_programado
            )

            registrar_fim_scanner(
                execucao_id=execucao_id,
                status="sucesso",
                duracao_segundos=duracao,
                candles_novos=int(
                    resultado.get(
                        "candles_novos",
                        0,
                    )
                ),
                oportunidades_encontradas=int(
                    resultado.get(
                        "oportunidades_encontradas",
                        0,
                    )
                ),
                emails_enviados=int(
                    resultado.get(
                        "emails_enviados",
                        0,
                    )
                ),
                emails_ignorados=int(
                    resultado.get(
                        "emails_ignorados",
                        0,
                    )
                ),
                emails_falhas=int(
                    resultado.get(
                        "emails_com_falha",
                        0,
                    )
                ),
            )

            self.atualizar_monitoramento_online()

            logger.info(
                "Scanner automático concluído. "
                f"Horário marcado: "
                f"{horario_programado.isoformat()}."
            )

            print()
            print(
                "Scanner concluído e horário "
                "registrado com sucesso."
            )

        except KeyboardInterrupt:
            duracao = (
                time.time() - inicio_execucao
            )

            registrar_fim_scanner(
                execucao_id=execucao_id,
                status="interrompida",
                duracao_segundos=duracao,
                erro=(
                    "Execução interrompida "
                    "pelo usuário."
                ),
            )

            logger.info(
                "Scanner automático interrompido "
                "pelo usuário."
            )

            raise

        except Exception as erro:
            duracao = (
                time.time() - inicio_execucao
            )

            registrar_fim_scanner(
                execucao_id=execucao_id,
                status="erro",
                duracao_segundos=duracao,
                erro=str(erro),
            )

            logger.erro(
                "Erro no scanner automático: "
                f"{erro}"
            )

            print()
            print(
                "Erro ao executar o scanner "
                "automático:"
            )
            print(erro)

            print(
                "O horário não foi marcado como "
                "concluído e poderá ser tentado "
                "novamente."
            )

        finally:
            self.scanner_em_execucao = False

    def executar_laboratorio(
        self,
        horario_programado: datetime,
    ):
        if self.laboratorio_em_execucao:
            logger.info(
                "Laboratório não iniciado porque "
                "já existe uma execução em andamento."
            )
            return

        if laboratorio_ja_executado(
            horario_programado
        ):
            return

        self.laboratorio_em_execucao = True

        execucao_id = registrar_inicio_execucao(
            tipo="laboratorio",
            horario_programado=(
                horario_programado.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            ),
            recuperacao=False,
        )

        inicio_execucao = time.time()

        print()
        print("=" * 60)
        print("LABORATÓRIO AUTOMÁTICO")
        print("=" * 60)

        print(
            "Horário programado:",
            formatar_momento(
                horario_programado
            ),
        )

        print(
            "Início real:",
            formatar_momento(
                datetime.now()
            ),
        )

        logger.info(
            "Laboratório automático iniciado. "
            f"Horário programado: "
            f"{horario_programado.isoformat()}."
        )

        try:
            resultado = executar_laboratorio_service(
                top=20,
                reprocessar_todos=False,
            )

            sucesso = bool(
                resultado
                and resultado.get("sucesso")
            )

            duracao = (
                time.time() - inicio_execucao
            )

            if not sucesso:
                mensagem_erro = (
                    resultado.get("erro")
                    if resultado
                    else None
                ) or (
                    "O serviço do laboratório terminou "
                    "sem indicar sucesso."
                )

                registrar_fim_laboratorio(
                    execucao_id=execucao_id,
                    status="erro",
                    duracao_segundos=duracao,
                    erro=mensagem_erro,
                )

                logger.erro(mensagem_erro)

                print(mensagem_erro)

                print(
                    "A execução mensal não será marcada "
                    "como concluída."
                )

                return

            marcar_laboratorio_executado(
                horario_programado
            )

            registrar_fim_laboratorio(
                execucao_id=execucao_id,
                status="sucesso",
                duracao_segundos=duracao,
            )

            self.atualizar_monitoramento_online()

            logger.info(
                "Laboratório automático concluído. "
                f"Horário marcado: "
                f"{horario_programado.isoformat()}."
            )

            print()
            print(
                "Laboratório concluído e execução "
                "mensal registrada com sucesso."
            )

        except KeyboardInterrupt:
            duracao = (
                time.time() - inicio_execucao
            )

            registrar_fim_laboratorio(
                execucao_id=execucao_id,
                status="interrompida",
                duracao_segundos=duracao,
                erro=(
                    "Execução interrompida "
                    "pelo usuário."
                ),
            )

            logger.info(
                "Laboratório automático interrompido "
                "pelo usuário."
            )

            raise

        except Exception as erro:
            duracao = (
                time.time() - inicio_execucao
            )

            registrar_fim_laboratorio(
                execucao_id=execucao_id,
                status="erro",
                duracao_segundos=duracao,
                erro=str(erro),
            )

            logger.erro(
                "Erro no laboratório automático: "
                f"{erro}"
            )

            print()
            print(
                "Erro ao executar o laboratório "
                "automático:"
            )
            print(erro)

            print(
                "A execução mensal não foi marcada "
                "como concluída."
            )

        finally:
            self.laboratorio_em_execucao = False

    def verificar_scanner_normal(
        self,
        agora: datetime,
    ) -> bool:
        horario = horario_scanner_correspondente(
            momento=agora
        )

        if horario is None:
            return False

        horario_programado = datetime.combine(
            agora.date(),
            horario,
        )

        if scanner_ja_executado(
            horario_programado
        ):
            return False

        self.executar_scanner(
            horario_programado=horario_programado,
            recuperacao=False,
        )

        return True

    def verificar_scanner_perdido(
        self,
        agora: datetime,
    ) -> bool:
        horario_perdido = horario_scanner_perdido(
            momento=agora
        )

        if horario_perdido is None:
            return False

        if scanner_ja_executado(
            horario_perdido
        ):
            return False

        self.executar_scanner(
            horario_programado=horario_perdido,
            recuperacao=True,
        )

        return True

    def verificar_laboratorio(
        self,
        agora: datetime,
    ) -> bool:
        if not deve_executar_laboratorio(
            momento=agora
        ):
            return False

        horario_programado = (
            horario_programado_laboratorio(
                momento=agora
            )
        )

        if horario_programado is None:
            return False

        if laboratorio_ja_executado(
            horario_programado
        ):
            return False

        self.executar_laboratorio(
            horario_programado
        )

        return True

    def executar_ciclo(self):
        agora = datetime.now()

        laboratorio_executado = (
            self.verificar_laboratorio(agora)
        )

        if laboratorio_executado:
            return

        scanner_normal_executado = (
            self.verificar_scanner_normal(
                agora
            )
        )

        if scanner_normal_executado:
            return

        self.verificar_scanner_perdido(
            agora
        )

    def iniciar(self):
        criar_tabelas_monitoramento_scheduler()

        logger.info(
            "Scheduler iniciado."
        )

        self.atualizar_monitoramento_online()
        self.mostrar_inicializacao()

        try:
            while self.executando:
                try:
                    self.executar_ciclo()

                    self.atualizar_monitoramento_online()

                except KeyboardInterrupt:
                    raise

                except Exception as erro:
                    logger.erro(
                        "Erro inesperado durante "
                        "o ciclo do scheduler: "
                        f"{erro}"
                    )

                    print()
                    print(
                        "Erro durante o ciclo "
                        "do scheduler:"
                    )
                    print(erro)
                    print(
                        "O serviço continuará ativo."
                    )

                time.sleep(
                    INTERVALO_VERIFICACAO_SEGUNDOS
                )

        except KeyboardInterrupt:
            print()
            print(
                "Encerramento solicitado pelo usuário."
            )

        finally:
            self.parar()

    def parar(self):
        if not self.executando:
            return

        self.executando = False

        marcar_scheduler_offline()

        logger.info(
            "Scheduler finalizado."
        )

        print()
        print("=" * 60)
        print("SERVIÇO FINALIZADO")
        print("=" * 60)


def executar_scheduler():
    scheduler = Scheduler()
    scheduler.iniciar()